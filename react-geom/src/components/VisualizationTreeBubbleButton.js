import { useContext } from "react";
import { VisualizationContext } from "../contexts/Visualization.context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash, faEye } from "@fortawesome/free-solid-svg-icons";
import './VisualizationTreeBubbleButton.css'


export function VisualizationTreeBubbleButton () {
    const { showBubble, setShowBubble } = useContext(VisualizationContext);
    let texButton = '';
    let icon = null;

    if(!showBubble) {
        texButton = 'Show';
        icon = faEye;
    } else {
        texButton = 'Hide';
        icon = faEyeSlash;
    }
    
    const changeShow = () => {
        setShowBubble(!showBubble);
    }
    
    return (
        <button className='buttonTreeBubble' id="buttonTreeBubble" onClick={changeShow}>{texButton} Bubble Plot <FontAwesomeIcon icon={icon}/> </button>
    );
}

export default VisualizationTreeBubbleButton;