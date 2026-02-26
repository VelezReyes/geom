import { createContext, useState } from "react";

export const HoverHodesContext = createContext();

export const HoverHodesProvider = ({ children }) => {
    const [hoveredNode, setHoveredNode] = useState("");
    const [inactiveNodes, setInactiveNodes] = useState([]);
    
    return (
        <HoverHodesContext.Provider value={{hoveredNode, setHoveredNode, inactiveNodes, setInactiveNodes}}>
            {children}
        </HoverHodesContext.Provider>
    );

}

export default HoverHodesProvider;