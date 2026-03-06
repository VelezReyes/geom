#!/usr/bin/env Rscript

suppressPackageStartupMessages(library(jsonlite))

`%||%` <- function(a, b) if (!is.null(a)) a else b

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
      # Format: CODE:YYYY,YYYY
      raw <- args[[i + 1]]
      parts <- strsplit(raw, ":", fixed = TRUE)[[1]]
      if (length(parts) != 2) stop("Invalid --pair format. Expected CODE:YYYY,YYYY")
      years <- suppressWarnings(as.integer(strsplit(parts[[2]], ",", fixed = TRUE)[[1]]))
      years <- years[!is.na(years)]
      if (length(years) == 0) stop("Invalid years in --pair argument")
      out$pairs[[length(out$pairs) + 1]] <- list(code = parts[[1]], years = years)
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
data_root <- file.path(repo_root, "react-geom/public/data")

leaf_stats <- function(node, depth = 0) {
  if (!is.null(node$info)) {
    return(list(leaves = 1L, max_depth = depth, boxes = c(as.integer(node$info$Box_Number))))
  }
  total <- 0L
  md <- depth
  boxes <- integer(0)
  if (!is.null(node$children)) {
    for (ch in node$children) {
      s <- leaf_stats(ch, depth + 1)
      total <- total + s$leaves
      md <- max(md, s$max_depth)
      boxes <- c(boxes, s$boxes)
    }
  }
  list(leaves = total, max_depth = md, boxes = boxes)
}

collect_pairs <- function() {
  if (length(args$pairs) > 0) return(args$pairs)
  files <- list.files(file.path(data_root, "ex-ante/tree"), pattern = "_exante\\.json$", full.names = FALSE)
  out <- list()
  for (f in files) {
    code <- sub("^(.*)_([0-9]{4})_exante\\.json$", "\\1", f)
    year <- suppressWarnings(as.integer(sub("^(.*)_([0-9]{4})_exante\\.json$", "\\2", f)))
    if (!is.na(year)) out[[length(out) + 1]] <- list(code = code, years = c(year))
  }
  out
}

pairs <- collect_pairs()
if (length(pairs) == 0) stop("No pairs to validate.")

fail_count <- 0L

for (entry in pairs) {
  code <- entry$code
  for (year in entry$years) {
    for (phase in c("ex-ante", "ex-post")) {
      suffix <- ifelse(phase == "ex-ante", "exante", "expost")
      tree_path <- sprintf("%s/%s/tree/%s_%d_%s.json", data_root, phase, code, year, suffix)
      bubble_path <- sprintf("%s/%s/bubble-plot/%s_%d_%s.csv", data_root, phase, code, year, suffix)

      if (!file.exists(tree_path) || !file.exists(bubble_path)) {
        next
      }

      tr <- fromJSON(tree_path, simplifyVector = FALSE)
      stats <- leaf_stats(tr, 0)
      b <- read.csv(bubble_path, stringsAsFactors = FALSE)
      bset <- unique(as.integer(b$Box_Number))
      missing <- setdiff(unique(stats$boxes), bset)
      ok <- length(missing) == 0
      if (!ok) fail_count <- fail_count + 1L

      cat(sprintf(
        "%s %d %s | leaves=%d depth=%d missingBoxInBubble=%d\n",
        code, year, suffix, stats$leaves, stats$max_depth, length(missing)
      ))
    }
  }
}

if (fail_count > 0) {
  cat("\nValidation failed for", fail_count, "tree/bubble pair(s).\n")
  quit(status = 1)
}

cat("\nValidation passed.\n")
