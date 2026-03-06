#!/usr/bin/env Rscript

suppressPackageStartupMessages(library(jsonlite))

`%||%` <- function(a, b) if (!is.null(a)) a else b

default_pairs <- list(
  list(out = "USA", src = "USA", years = c(2016, 2018)),
  list(out = "BIH", src = "BIH", years = c(2022)),
  list(out = "KAZ", src = "KAZ", years = c(2022)),
  list(out = "MKD", src = "MKD", years = c(2022)),
  list(out = "MNE", src = "MNE", years = c(2022)),
  list(out = "RUS", src = "RUS", years = c(2022)),
  list(out = "SRB", src = "SRB", years = c(2022)),
  list(out = "TUR", src = "TUR", years = c(2022)),
  list(out = "XKX", src = "XKX", years = c(2022)),
  list(out = "UK", src = "GBR", years = c(2009, 2011, 2013, 2015, 2017, 2019))
)

parse_args <- function() {
  args <- commandArgs(trailingOnly = TRUE)
  out <- list(root = NA_character_, pairs = list())
  i <- 1
  while (i <= length(args)) {
    token <- args[[i]]
    if (token == "--root" && i < length(args)) {
      out$root <- args[[i + 1]]
      i <- i + 2
      next
    }
    if (token == "--pair" && i < length(args)) {
      # Format: OUT:SRC:YYYY,YYYY
      raw <- args[[i + 1]]
      parts <- strsplit(raw, ":", fixed = TRUE)[[1]]
      if (length(parts) != 3) {
        stop("Invalid --pair format. Expected OUT:SRC:YYYY,YYYY")
      }
      years <- suppressWarnings(as.integer(strsplit(parts[[3]], ",", fixed = TRUE)[[1]]))
      years <- years[!is.na(years)]
      if (length(years) == 0) {
        stop("Invalid --pair years section. Example: --pair USA:USA:2016,2018")
      }
      out$pairs[[length(out$pairs) + 1]] <- list(out = parts[[1]], src = parts[[2]], years = years)
      i <- i + 2
      next
    }
    stop(paste("Unknown or incomplete argument:", token))
  }
  out
}

args <- parse_args()

cmd_args <- commandArgs(trailingOnly = FALSE)
file_arg <- cmd_args[grepl("^--file=", cmd_args)][1]
script_path <- if (!is.na(file_arg)) sub("^--file=", "", file_arg) else "."
script_dir <- normalizePath(dirname(script_path), winslash = "/", mustWork = FALSE)
root_input <- if (is.na(args$root)) file.path(script_dir, "..") else args$root
repo_root <- normalizePath(root_input, winslash = "/", mustWork = TRUE)
pairs <- if (length(args$pairs) > 0) args$pairs else default_pairs

read_labels <- function(root, src, year) {
  cands <- c(
    sprintf("%s/geom_v2/estimates/labels/%d_%s.csv", root, year, src),
    sprintf("%s/geom_v2/estimates/labels/%d_%s.csv", root, year, tolower(src))
  )
  p <- cands[file.exists(cands)][1]
  if (is.na(p)) return(data.frame())
  read.csv(p, stringsAsFactors = FALSE)
}

label_for <- function(labels_df, varname, raw_values) {
  if (nrow(labels_df) == 0) return(as.character(raw_values))
  lv <- labels_df[labels_df$variable == varname, , drop = FALSE]
  if (nrow(lv) == 0) return(as.character(raw_values))
  map <- setNames(lv$class, as.character(lv$value))
  vapply(as.character(raw_values), function(v) {
    if (!is.na(map[v])) map[v] else v
  }, character(1))
}

pick_rdata <- function(root, phase, src, year) {
  cands <- c(
    sprintf("%s/geom_v2/plots/trees/new/%s/obj_%s_tree_%s_%d_all.RData", root, phase, phase, src, year),
    sprintf("%s/geom_v2/estimates/Rdata/obj_%s_tree_%s_%d_all.RData", root, phase, src, year),
    sprintf("%s/geom_v2/plots/trees/update/%s/obj_%s_tree_%s_%d_all.RData", root, phase, phase, src, year),
    sprintf("%s/geom_v2/plots/trees/update/%s/obj_%s_tree_%s_%d_all.RData", root, phase, phase, tolower(src), year),
    sprintf("%s/geom_v2/estimates/Rdata/obj_%s_tree_%s_%d_all.RData", root, phase, tolower(src), year)
  )
  p <- cands[file.exists(cands)][1]
  if (is.na(p)) return(NA_character_)
  p
}

safe_num <- function(x, default = NA_real_) {
  v <- suppressWarnings(as.numeric(x))
  if (length(v) == 0 || is.na(v)) return(default)
  v
}

extract_tree_obj <- function(loaded_obj) {
  if (is.list(loaded_obj) && !is.null(loaded_obj$node) && !is.null(loaded_obj$data)) {
    return(loaded_obj)
  }
  if (is.list(loaded_obj) &&
      !is.null(loaded_obj$tree) &&
      is.list(loaded_obj$tree) &&
      !is.null(loaded_obj$tree$node) &&
      !is.null(loaded_obj$tree$data)) {
    return(loaded_obj$tree)
  }
  NULL
}

total_written <- 0L
total_skipped <- 0L

for (entry in pairs) {
  out_code <- entry$out
  src_code <- entry$src

  for (year in entry$years) {
    labels_df <- read_labels(repo_root, src_code, year)

    for (phase in c("exante", "expost")) {
      rdata_path <- pick_rdata(repo_root, phase, src_code, year)
      if (is.na(rdata_path)) {
        cat("skip missing rdata:", out_code, year, phase, "\n")
        total_skipped <- total_skipped + 1L
        next
      }

      env <- new.env(parent = emptyenv())
      load(rdata_path, envir = env)
      obj_names <- ls(env)

      tree_obj <- NULL
      preferred <- obj_names[grepl(sprintf("^obj_%s_tree|^%s_tree|^tree_tr$", phase, phase), obj_names)]
      for (nm in c(preferred, obj_names)) {
        cand <- extract_tree_obj(get(nm, envir = env))
        if (!is.null(cand)) {
          tree_obj <- cand
          break
        }
      }

      if (is.null(tree_obj)) {
        cat("skip unsupported rdata shape:", out_code, year, phase, "\n")
        total_skipped <- total_skipped + 1L
        next
      }

      data_df <- tree_obj$data
      feature_names <- setdiff(colnames(data_df), "income")
      data_folder <- ifelse(phase == "exante", "ex-ante", "ex-post")

      bubble_path <- sprintf(
        "%s/react-geom/public/data/%s/bubble-plot/%s_%d_%s.csv",
        repo_root, data_folder, out_code, year, phase
      )
      if (!file.exists(bubble_path)) {
        cat("skip missing bubble:", out_code, year, phase, "\n")
        total_skipped <- total_skipped + 1L
        next
      }

      bubble_df <- read.csv(bubble_path, stringsAsFactors = FALSE)
      bubble_key <- as.character(bubble_df$Box_Number)
      bubble_map <- setNames(seq_len(nrow(bubble_df)), bubble_key)
      leaf_counter <- 0L

      build_node <- NULL
      build_node <- function(node, incoming_condition = NULL) {
        if (is.null(node$split)) {
          leaf_counter <<- leaf_counter + 1L

          node_id <- suppressWarnings(as.integer(node$id))
          if (length(node_id) == 0 || is.na(node_id)) {
            node_id <- suppressWarnings(as.integer(bubble_df$Box_Number[leaf_counter]))
            if (length(node_id) == 0 || is.na(node_id)) node_id <- leaf_counter
          }

          key <- as.character(node_id)
          idx <- NA_integer_
          if (length(key) > 0 && key %in% names(bubble_map)) {
            idx <- unname(as.integer(bubble_map[key]))
          } else if (leaf_counter <= nrow(bubble_df)) {
            idx <- leaf_counter
          }

          rel <- NA_real_
          pop <- NA_real_
          box <- node_id

          if (!is.na(idx) && idx >= 1 && idx <= nrow(bubble_df)) {
            rel <- safe_num(bubble_df$Relative_Type_Mean[idx])
            pop <- safe_num(bubble_df$Pop_Share[idx])
            box <- suppressWarnings(as.integer(bubble_df$Box_Number[idx]))
            if (length(box) == 0 || is.na(box)) box <- node_id
          }

          if (is.na(rel) || is.na(pop)) {
            rel <- 1
            pop <- 0
          }

          leaf <- list(
            id = node_id,
            info = list(
              Relative_Type_Mean = round(rel, 3),
              Pop_Share = round(pop, 2),
              Box_Number = box
            )
          )
          if (!is.null(incoming_condition)) leaf$split_condition <- incoming_condition
          return(leaf)
        }

        varid <- suppressWarnings(as.integer(node$split$varid))
        varname <- if (!is.na(varid) && varid >= 1 && varid <= length(feature_names)) {
          feature_names[varid]
        } else {
          paste0("V", varid)
        }
        idx <- node$split$index

        vals <- sort(unique(data_df[[varname]]))
        if (length(vals) != length(idx)) {
          vals <- seq_len(length(idx))
        }

        kids <- vector("list", length(node$kids))
        for (k in seq_along(node$kids)) {
          members <- vals[which(idx == k)]
          labels <- label_for(labels_df, varname, members)
          cond_text <- paste(labels, collapse = ",")
          cond <- sprintf("%s -> %s", varname, cond_text)
          kids[[k]] <- build_node(node$kids[[k]], cond)
        }

        internal_id <- suppressWarnings(as.integer(node$id))
        if (length(internal_id) == 0 || is.na(internal_id)) internal_id <- 0L

        internal <- list(
          id = internal_id,
          children = kids,
          nodeName = varname
        )
        if (!is.null(incoming_condition)) internal$split_condition <- incoming_condition
        internal
      }

      json_tree <- build_node(tree_obj$node, NULL)
      out_path <- sprintf(
        "%s/react-geom/public/data/%s/tree/%s_%d_%s.json",
        repo_root, data_folder, out_code, year, phase
      )
      write_json(json_tree, out_path, pretty = TRUE, auto_unbox = TRUE, null = "null")
      cat("wrote:", out_path, "\n")
      total_written <- total_written + 1L
    }
  }
}

cat("\nDone. Files written:", total_written, "| skipped:", total_skipped, "\n")
