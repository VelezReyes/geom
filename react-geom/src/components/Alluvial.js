import { useContext, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ResizeObserver from 'resize-observer-polyfill';
import { FilterContext } from '../contexts/Filter.context';

export const getData = async ({ country, year }) => {
    let data = {
        links: [],
        nodes: [],
        tooltipData: []
    };
    try {
        data.links = await d3.json(`./data/alluvial/links/${country}_${year}_LINKS.json`);
        data.nodes = await d3.json(`./data/alluvial/nodes/${country}_${year}_NODES.json`);
        let tooltipExAnte = await d3.csv(`/data/ex-ante/bubble-plot/${country}_${year}_exante.csv`);
        let tooltipExPost = await d3.csv(`/data/ex-post/bubble-plot/${country}_${year}_expost.csv`);
        data.tooltipData = [...tooltipExAnte, ...tooltipExPost];
        return data;
    } catch (e) {
        console.log('error load data ', e);
    }
}
/*
  This looks for the right and left nodes next to the data.
  The data is filtered and classified by columns, in this case right and left, also based on this information the dimensions of the links will be generated.
  Explanation about the structure of the information and its use is detailed on this site https://d3js.org/d3-force/link#link_id
*/
export const filter = ({ data }) => {
    console.log('#######filter###---->>>>> ', data)
    const dataFilter = data.nodes.map((rows, index) => {
        const filterRight = data.links.filter((uniqueLink) => {
            return uniqueLink.target == index;
        });
        const filterLeft = data.links.filter((uniqueLink) => {
            return uniqueLink.source == index;
        });
        if (filterLeft.length > 0 || filterRight.length > 0) {
            return {
                left: filterLeft,
                right: filterRight
            };
        }
        return {
            left: [],
            right: []
        };
    });
    return dataFilter;
}
/*
  Search if the node has one or more links. Calculation of the number of 
  links that each node has to generate a weight that will allow generating the scales within the nodes and determining the exit position of the links
*/
export const segmentationSumHeights = ({ nodes, column, node, partFromData }) => {
    let nodesIncludes = [];
    let heights = { column, node };
    nodes.forEach((link) => {
        if (nodesIncludes.includes(link[partFromData])) {
            heights[link[partFromData]] += 1;
        } else {
            nodesIncludes.push(link[partFromData])
            heights[link[partFromData]] = 1;
        }
    });
    return heights;
}

export const addTataForTooltips = ({ data, tree, nodeIndex }) => {
    const dataNodeToolTip = data.tooltipData.filter((dataOfNode) => {
        const condition = dataOfNode.Box_Number == data.nodes[nodeIndex].id && dataOfNode.Type == tree;
        return condition;
    });
    data.nodes[nodeIndex] = { ...data.nodes[nodeIndex], tooltipData: dataNodeToolTip[0] };
}

export const heightsNodesCalculate = ({ columnsFilter, data }) => {
    let allHeights = [];
    columnsFilter.forEach((nodes, nodeIndex) => {
        if (nodes.left.length) {
            addTataForTooltips({ data, tree: 'exante', nodeIndex });
            const node = nodes.left[0].source;
            allHeights[node] = segmentationSumHeights({ nodes: nodes.left, column: 'left', node, partFromData: 'target' });
        };
        if (nodes.right.length) {
            addTataForTooltips({ data, tree: 'expost', nodeIndex });
            const node = nodes.right[0].target;
            allHeights[node] = segmentationSumHeights({ nodes: nodes.right, column: 'right', node, partFromData: 'source' });
        };
    })
    return allHeights;
}

export const generateScalerColors = ({ data }) => {
    let sumNodesIdsForRangeColor = 0;
    data.nodes.forEach((node) => {
        const idNumber = parseInt(node.id, 10);
        sumNodesIdsForRangeColor += idNumber;
    });
    const colorScale = d3.scaleOrdinal();
    colorScale.domain([1, sumNodesIdsForRangeColor]);
    colorScale.range(['#E04F1D', '#7AE028', '#E0112B', '#28E0B7', '#BD00DB', '#6212E0', '#F0B05F', '#EF8F8B', '#E5A5FF', '#DEE18E', '#E5C61E']);
    return colorScale;
}

export const generateScalerHeightNodes = ({ heightSvg, data }) => {
    const totalLinks = data.links.length;
    const heightSvgInitialPosition = 0;
    const countInitialTotalLinks = 0;
    const scalerHeightNodes = d3.scaleLinear();
    scalerHeightNodes.domain([countInitialTotalLinks, totalLinks]);
    scalerHeightNodes.range([heightSvgInitialPosition, heightSvg]);
    return scalerHeightNodes;
}

export const transformData = ({ data, heightSvg }) => {
    const columnsFilter = filter({ data });
    /*
    calculate node height based on the number of links it has, 
    there are many repeated liks that determine the width of a link and the node
    */
    const heightsNodes = heightsNodesCalculate({ columnsFilter, data });
    //generate scalers
    const colorScale = generateScalerColors({ data });
    const scalerHeightNodes = generateScalerHeightNodes({ heightSvg, data });
    const totalLinks = data.links.length;
    return {
        heights: heightsNodes,
        scalerHeightNodes,
        totalLinks,
        columnsFilter,
        colorScale,
        dataAlluvial: data
    }
};
//sum links heights for print graph
export const sumHeightsLinksArray = (data, isSumLinks) => {
    let sumHeights = 0;
    let linksArray = [];
    //sum heights for nodes or links depends of isSumLinks
    for (const [key, value] of Object.entries(data)) {
        const validation = key != 'column' && key != 'beforeScale' && key != 'node';
        if (validation) {
            sumHeights += value;
            if (isSumLinks) {
                let link = {};
                link[key] = value;
                linksArray.push(link);
            }
        }
    }
    return {
        sumHeights,
        linksArray
    };
};
//calculate Heights of nodes
export const beforeHeightFunction = ({ d, sumHigthBefore, sumCurrentHeight, beforeScale, columnsScalerHeights }) => {
    const { sumHeights } = sumHeightsLinksArray(d);
    //If sumHeights is equal to 0 it is because it is the first and there is nothing before it
    const existElementsBefore = sumCurrentHeight === 0;
    sumHigthBefore = columnsScalerHeights.scalerHeightNodes(sumHeights);
    sumCurrentHeight += columnsScalerHeights.scalerHeightNodes(sumHeights);
    if (existElementsBefore) {
        beforeScale = 0;
    } else {
        beforeScale = sumCurrentHeight - sumHigthBefore;
    }
    return [
        beforeScale,
        sumHigthBefore,
        sumCurrentHeight
    ];
}
//sum heights for links and return array with links
export const heightsLinks = ({ d }) => {
    let {
        sumHeights,
        linksArray
    } = sumHeightsLinksArray(d, true);
    d['linksArray'] = linksArray;
    return sumHeights;
}
//extract data for left and right column
export const splitDataColumns = ({ columnsScalerHeights }) => {
    let columnLeft = [];
    let columnRight = [];
    columnsScalerHeights.heights.forEach((height, index) => {
        if (height.column == 'left') {
            columnLeft.push(height);
        }
        if (height.column == 'right') {
            columnRight.push(height);
        }
    });
    return {
        columnLeft,
        columnRight
    };
}
/*
scalar generates the height for the link based on the number 
of repeated links with the same source and target
*/
export const scalerLinkns = ({ currentHeightY, sumHeightLinks }) => {
    return d3.scaleLinear()
        .domain([0, sumHeightLinks])
        .range([0, currentHeightY]);
}
//use memory reference save data for ubicate links
export const saveCoordenatesYEachNode = ({ d }) => {
    const scaler = scalerLinkns({ currentHeightY: d.currentHeightY, sumHeightLinks: d.sumLinks });
    d['heightLinks'] = scaler;
    d['usedSpace'] = 0;
}

export const tooltipUbitcation = ({ event, tooltipRef }) => {
    //position the tooltip as the mouse moves
    let leftCursorPosition = 200;
    const positionUpCursor = 30;
    const scrollY = window.scrollY;
    leftCursorPosition -= scrollY;
    d3.select(tooltipRef.current)
        .style('top', `${event.clientY - leftCursorPosition}px`)
        .style('left', `${event.clientX + positionUpCursor}px`)
        .style('display', 'block')
        .style('opacity', '0.9')
}

export const nameGroupNodes = ({ column }) => {
    //determinate name group for nodes
    let groupNodeOrigin = '';
    let groupNodeDestination = '';
    if (column == 'right') {
        groupNodeOrigin = 'Ex-post';
        groupNodeDestination = 'Ex-ante';
    } else {
        groupNodeOrigin = 'Ex-ante';
        groupNodeDestination = 'Ex-post'
    }
    return {
        groupNodeDestination,
        groupNodeOrigin
    };
}

export const lookForDataTextTooltip = ({ columnsScalerHeights, nodeOriginIndex }) => {
    const dataTooltip = columnsScalerHeights.dataAlluvial.nodes[nodeOriginIndex].tooltipData;
    return dataTooltip;
}

export const generateTextTooltip = ({ columnsScalerHeights, nodeOriginIndex }) => {
    //text tooltip
    const dataTooltip = lookForDataTextTooltip({ columnsScalerHeights, nodeOriginIndex });
    const dataTooltipUsers = {
        Mother_Edu: 'Mother Education',
        Birth_Area: 'Birth Area',
        Mother_Occ: 'Mother Occupation',
        Ethnicity: 'Ethnicity',
        Sex: 'Sex',
        Father_Occ: 'Father Occupation',
        Father_Edu: 'Father Education',
        Pop_Share: 'Population Share (%)',
        Relative_Type_Mean: 'Relative Type Mean',
    }
    let htmlTextInfoToolTip = `<p>`;
    Object.entries(dataTooltipUsers).forEach((data) => {
        const namePropertie = data[0];
        const nameForUsers = data[1];
        let content = dataTooltip[namePropertie];
        if (content != '') {
            content = content.replaceAll(',', ', ');
            htmlTextInfoToolTip = `${htmlTextInfoToolTip}<br><b>${nameForUsers}:</b> ${content}`;
        }
    });
    htmlTextInfoToolTip = `${htmlTextInfoToolTip}</p>`;
    return htmlTextInfoToolTip;
}

export const putTextTooltipNodes = ({ dataNode, columnsScalerHeights, tooltipRef }) => {
    //data label origin
    const nodeOriginIndex = dataNode.node;
    const htmlTextInfoToolTip = generateTextTooltip({ columnsScalerHeights, nodeOriginIndex });
    d3.select(tooltipRef.current)
        .html(htmlTextInfoToolTip);
}

export const printNodesLabels = ({ newG, measures, data, xPosition, columnsScalerHeights }) => {
    let currentHeightLabelY = 0;
    newG
        .data(data)
        .append('text')
        .attr('stroke', 'black')
        .attr('x', xPosition)
        .attr('y', (d) => {
            /*
            positioning for labels based on the node scaler 
            divide and add by two to not leave the text at the beginning but in the center
            */
            const partsOfHeightNode = 2;
            const heightNode = d.currentHeightY;
            const positionLabel = heightNode / partsOfHeightNode;
            currentHeightLabelY += heightNode;
            return (currentHeightLabelY - heightNode) + positionLabel;
        })
        .attr('x', (d) => {
            const positionLeft = measures.widthNodes / 2;
            if (d.column == 'left') {
                return positionLeft;
            } else {
                return measures.width - positionLeft;
            }
        })
        .text((d) => {
            //is the index that represents the node in columnsScalerHeights.dataAlluvial
            return `${columnsScalerHeights.dataAlluvial.nodes[d.node].id}`;
        })
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle');
}

export const listenersShowTooltip = ({ newG, columnsScalerHeights, tooltipRef }) => {
    newG
        .on('mousemove', function (event) {
            tooltipUbitcation({ event, tooltipRef });
            //get data node into nodes
            let dataNode = d3.select(this).data()[0];
            const indexNode = dataNode.node;
            putTextTooltipNodes({ dataNode, columnsScalerHeights, tooltipRef });
            d3.select(`#node-main-${indexNode}`)
                .attr('opacity', '1')
                .attr('filter', 'brightness(1)');
            //highlight columns and links
            const node = indexNode;
            d3.selectAll(`.from-node-${node}`).attr('opacity', '1');
            d3.selectAll(`.node-connection-${node}`).attr('opacity', '1');
        })
        .on('mouseout', function (event) {
            let dataNode = d3.select(this).data()[0];
            const indexNode = dataNode.node;
            d3.select(`#node-main-${indexNode}`).attr('opacity', '.5');
            d3.selectAll(`.from-node-${dataNode.node}`).attr('opacity', '.5');
            d3.selectAll(`.node-connection-${dataNode.node}`).attr('opacity', '.5');
            //hidden tooltip
            d3.select(tooltipRef.current)
                .style('display', 'none');
        });
}

export const printNodes = ({ enter, columnsScalerHeights, xPosition, measures, data, tooltipRef }) => {
    let currentHeightY = 0;
    let currentHeightLabelY = 0;
    let beforeScale = 0;
    let sumHeightLinks = 0;
    //reset values ​​used in scalerHeightNodes function
    let sumHigthBefore = 0;
    let sumCurrentHeight = 0;
    //main label g for nodes
    let newG = enter.append('g')
        .attr('id', (d) => {
            return `node-main-container${d.node}`;
        })
    newG
        .append('rect')
        .attr('x', xPosition)
        .attr('y', (d) => {
            [beforeScale, sumHigthBefore, sumCurrentHeight] = beforeHeightFunction({ d, sumHigthBefore, sumCurrentHeight, beforeScale, columnsScalerHeights, currentHeightLabelY });
            d['beforeScale'] = beforeScale;
            return beforeScale;
        })
        .attr('width', measures.widthNodes)
        .attr('height', (d) => {
            //use in-memory references to store height information
            sumHeightLinks = heightsLinks({ d })
            currentHeightY = columnsScalerHeights.scalerHeightNodes(sumHeightLinks);
            d['currentHeightY'] = currentHeightY;
            d['sumLinks'] = sumHeightLinks;
            return currentHeightY;
        })
        .attr('fill', (d) => {
            const idNode = d.node;
            const colorNode = columnsScalerHeights.colorScale(idNode);
            d['colorNode'] = colorNode;
            return colorNode;
        })
        .each((d) => {
            // determine link width
            saveCoordenatesYEachNode({ d });
        })
        .attr('node', (d) => {
            const nodeCurrent = d.node;
            return nodeCurrent;
        })
        .attr('class', (d) => {
            //add class for can select columns for put  highlight
            let arrayLinks = d.linksArray;
            let classForHighlight = '';
            arrayLinks.forEach((link) => {
                const [node, weight] = Object.entries(link);
                classForHighlight = `${classForHighlight} node-connection-${node[0]}`;
            });
            classForHighlight = `${classForHighlight} node-main-${d.node}`;
            return classForHighlight;
        })
        .attr('opacity', '.5')
        .attr('id', (d) => {
            return `node-main-${d.node}`;
        })
        .exit()
        .append('text');
    //add labels and listeners for controller tooltip
    printNodesLabels({ newG, measures, data, xPosition, columnsScalerHeights });
    listenersShowTooltip({ newG, columnsScalerHeights, tooltipRef });
}

export const printColumn = ({ data, xPosition = 0, columnsScalerHeights, measures, tooltipRef, svgMain }) => {
    //print column
    svgMain
        .append('g')
        .selectAll('g')
        .data(data)
        .join((enter) => {
            printNodes({ enter, columnsScalerHeights, xPosition, measures, data, tooltipRef });
        });
}
//find and return the position for the link from the left
export const enterToRightColumn = ({ valorFromLeft, useSpace, columnRight }) => {
    let positionForLink = 0;
    columnRight.forEach((node) => {
        if (node.node == valorFromLeft) {
            //enter the position where the node starts add the space used this gives the space that can be used
            positionForLink = node.beforeScale + node.usedSpace;
            node.usedSpace = node.usedSpace + useSpace;
        }
    });
    return positionForLink;
}

export const generateLinkPath = ({ d, sumHeigLinks, columnRight, columnLeft, measures, link }) => {
    //using array created previously in printing nodes
    const parseArrayLinks = Object.entries(d);
    const scaler = columnLeft[0].heightLinks(parseArrayLinks[0][1]);
    sumHeigLinks += scaler;
    //position the link in the center of the node
    const startY = (sumHeigLinks - scaler) + (scaler / 2);
    //bring the link position to the left 
    const node = parseArrayLinks[0][0];
    const positionTarget = enterToRightColumn({ valorFromLeft: node, useSpace: scaler, columnRight });
    //positionTarget plus scaler divided by two this is because the position must be centered and halved
    const centerPosition = positionTarget + (scaler / 2);
    const positionXTarget = measures.width - measures.widthNodes;
    const positionXSource = measures.widthNodes;
    const dPath = link({ source: [positionXSource, startY], target: [positionXTarget, centerPosition] });
    return [
        dPath,
        sumHeigLinks
    ];
}

export const dataInfoLinkExAnte = ({ node, dataNode, group }) => {
    const texTooltip = `<b>Grouping ${group}</b>: ${node}<br><b>Relative Type Mean: </b> ${dataNode.Relative_Type_Mean}`;
    return texTooltip;
}

export const getIdNode = ({ columnsScalerHeights, nodeOriginIndex, nodeDestinationIndex }) => {
    let nodeOrigin = columnsScalerHeights.dataAlluvial.nodes[nodeOriginIndex];
    nodeOrigin = Object.values(nodeOrigin)[0];
    let nodeDestination = columnsScalerHeights.dataAlluvial.nodes[nodeDestinationIndex];
    nodeDestination = Object.values(nodeDestination)[0];
    return {
        nodeOrigin,
        nodeDestination
    };
}

export const putTextTooltipLinks = ({ select, columnsScalerHeights, tooltipRef }) => {
    const nodeOriginIndex = select.attr('data-node-origin');
    const nodeDestinationIndex = select.attr('data-node-destination');
    const nodeOriginDataTooltip = lookForDataTextTooltip({ columnsScalerHeights, nodeOriginIndex: nodeOriginIndex});
    const nodeDestinationDataTooltip = lookForDataTextTooltip({ columnsScalerHeights, nodeOriginIndex: nodeDestinationIndex});
    
    const { nodeOrigin, nodeDestination } = getIdNode({ columnsScalerHeights, nodeOriginIndex, nodeDestinationIndex });
    //display and place information in the tooltip
    d3.select(tooltipRef.current).selectAll('*').remove();
    d3.select(tooltipRef.current)
        .join()
        .append('p')
        .html(`${dataInfoLinkExAnte({ node: nodeOrigin, dataNode: nodeOriginDataTooltip, group: 'Ex-Ante' })}<br><hr>${dataInfoLinkExAnte({ node: nodeDestination, dataNode: nodeDestinationDataTooltip, group: 'Ex-Post' })}`);
    //highlight nodes origin and destination
    d3.select(`#node-main-${nodeOriginIndex}`)
        .attr('opacity', '1');
    d3.select(`#node-main-${nodeDestinationIndex}`)
        .attr('opacity', '1');
}

export const listenersShowTooltipLinks = ({ pathSvg, columnsScalerHeights, tooltipRef }) => {
    pathSvg
        .on('mouseover', function (envent) {
            d3.select(this)
                .attr('opacity', '1');
            const select = d3.select(this);
            putTextTooltipLinks({ select, columnsScalerHeights, tooltipRef });
        })
        .on('mousemove', function (event) {
            //position the tooltip as the mouse moves
            tooltipUbitcation({ event, tooltipRef });
        })
        .on('mouseout', function () {
            //remove the tooltip
            d3.select(this)
                .attr('opacity', '0.7');
            d3.select(tooltipRef.current)
                .style('display', 'none');
            //extract the information from the html about the link
            const select = d3.select(this);
            //highlight nodes origin and destination
            d3.select(`#node-main-${select.attr('data-node-origin')}`)
                .attr('opacity', '.5');
            d3.select(`#node-main-${select.attr('data-node-destination')}`)
                .attr('opacity', '.5');
        });
}

export const printLinks = ({ columnLeft, columnRight, measures, columnsScalerHeights, tooltipRef, svgMain }) => {
    //generate and print links
    let sumHeigLinks = 0;
    const link = d3.link(d3.curveBumpX);
    //generation of the links from the node on the left generate the coordinates on the right side in target
    columnLeft.forEach((columnLeftNodes, index) => {
        svgMain.append('g').selectAll('g').data(columnLeftNodes.linksArray).join((enter) => {
            const pathSvg = enter.append('path');
            pathSvg
                .attr('d', (d) => {
                    let dPath = '';
                    [dPath, sumHeigLinks] = generateLinkPath({ d, sumHeigLinks, columnRight, columnLeft, measures, link });
                    return dPath;
                })
                .attr('stroke-width', (d) => {
                    const parseArrayLinks = Object.entries(d);
                    //with the scaler determine the width of the link
                    const scaler = columnLeft[0].heightLinks(parseArrayLinks[0][1]);
                    return scaler;
                })
                //aditional information 
                .attr('data-node-origin', (d) => columnLeftNodes.node)
                .attr('data-node-destination', (d) => {
                    const parseArrayLinks = Object.entries(d);
                    return parseArrayLinks[0][0];
                })
                .attr('stroke', (d) => {
                    const colorNode = columnLeftNodes.colorNode;
                    return colorNode;
                })
                .attr('fill', 'none')
                .attr('opacity', '0.7')
                .attr('class', (d) => {
                    const parseArrayLinks = Object.entries(d);
                    const nodeRight = parseArrayLinks[0][0];
                    return `from-node-${columnLeftNodes.node} from-node-${nodeRight}`
                })
                .attr('id', `link-${index}`);
            listenersShowTooltipLinks({ pathSvg, columnsScalerHeights, tooltipRef })
        });
    });
}

export const printLabelsBottom = ({ measures, svgMain }) => {
    //create base for labels bottom 
    const labelsBottom = [
        { name: 'Ex-ante', position: (measures.widthNodes / 2) },
        { name: 'Type', position: measures.width / 2 },
        { name: 'Ex-post', position: measures.width - (measures.widthNodes / 2) }
    ]
    svgMain.append('g')
        .selectAll('g')
        .data(labelsBottom)
        .enter()
        .append('text')
        .text((d) => { return d.name })
        .attr('x', (d) => { return d.position })
        .attr('y', measures.height + (measures.marginBottom / 2))
        .attr('fill', 'black')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr('font-size', '30px')
        .attr('stroke', 'black');
}

export const printGraph = ({ columnsScalerHeights, svgRef, measures, tooltipRef }) => {
    //svg base
    const svgMain = d3.select(svgRef.current)
        .attr('width', measures.width)
        .attr('height', measures.height + measures.marginBottom);
    //clean svg 
    svgMain.selectAll('*').remove();
    // split data for columns
    let { columnLeft, columnRight } = splitDataColumns({ columnsScalerHeights });
    const positionXLeft = 0;
    const positionXRight = measures.width - measures.widthNodes;
    printColumn({ data: columnLeft, xPosition: positionXLeft, columnsScalerHeights, measures, tooltipRef, svgMain });
    printColumn({ data: columnRight, xPosition: positionXRight, columnsScalerHeights, measures, tooltipRef, svgMain });
    printLinks({ columnLeft, columnRight, measures, columnsScalerHeights, tooltipRef, svgMain });
    printLabelsBottom({ measures, svgMain });
}

export const useAutoResize = ({ divContainer }) => {
    const [measures, setMeasures] = useState({
        height: 800,
        widthNodes: 60,
        marginBottom: 50,
        width: 600
    });
    //create measures for svg
    //use 40 percent of the width of the main content 
    useEffect(() => {
        const resizeObserver = new ResizeObserver((observerDeatils) => {
            const { width } = observerDeatils[0].contentRect;
            const percentToUse = 40;
            const calculateWidth = (width * percentToUse) / 100;
            //avoid the memory references and allow to react see the changes in the variable 
            const newMesures = { ...measures }
            newMesures.width = calculateWidth;
            setMeasures(newMesures);
        });
        resizeObserver.observe(divContainer.current);
        return () => {
            resizeObserver.disconnect()
        }
    }, []);

    return { measures };
}

export function Alluvial() {
    const { filters } = useContext(FilterContext);
    const divContainer = useRef(null);
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);
    const { measures } = useAutoResize({ divContainer });
    // Load data 
    useEffect(() => {
        let isSubscribed = true;
        const validation = measures.width != undefined && filters.year && isSubscribed;
        if (validation) {
            const consultDataPrintGraph = async () => {
                const data = await getData({ country: filters.country, year: filters.year });
                // transform the data 
                const columnsScalerHeights = transformData({ data, heightSvg: measures.height });
                printGraph({ columnsScalerHeights, svgRef, measures, tooltipRef });
            }
            consultDataPrintGraph();
        }
        return () => {
            //clean references
            d3.select(svgRef.current).selectAll('*').remove();
            d3.select(tooltipRef.current).selectAll('*').remove();
            isSubscribed = false;
        }
    }, [filters.year, filters.country, measures]);
    return (
        <div ref={divContainer} style={{ position: 'relative', width: '100%', height: `${measures.height + measures.marginBottom}px`, display: 'grid', justifyContent: 'center' }}>
            <svg ref={svgRef} aria-label='svg-main' data-testid='svg-main' />
            <div id='tooltipRef' ref={tooltipRef} style={{ height: 'auto', width: 'auto', background: 'white', position: 'absolute', borderRadius: 15, padding: 10, display: 'none', maxWidth: 325 }} data-testid='div-tooltip' />
        </div>
    );
}

export default Alluvial;