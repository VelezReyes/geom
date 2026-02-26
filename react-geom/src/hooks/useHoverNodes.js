import { useState } from "react"

const useHoverNodes = () => {
    const [hoveredNode, setHoveredNode] = useState("");
    const [inactiveNodes, setInactiveNodes] = useState([]);
    
    return {
        hoveredNode, 
        setHoveredNode,
        inactiveNodes,
        setInactiveNodes
    }
}

export default useHoverNodes;