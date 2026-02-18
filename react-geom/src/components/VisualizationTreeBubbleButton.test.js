import { fireEvent, render, screen } from "@testing-library/react";
import VisualizationTreeBubbleButton from "./VisualizationTreeBubbleButton";
import { MemoryRouter } from "react-router-dom";
import { VisualizationContext } from "../contexts/Visualization.context";

describe('VisualizationTreeBubbleButton component', () => {
    test('VisualizationTreeBubbleButton should be show Hide', () => {
        const showBubble = true;
        const setShowBubble = jest.fn();

        render(
            <MemoryRouter>
                <VisualizationContext.Provider value={{showBubble, setShowBubble}}>
                    <VisualizationTreeBubbleButton />
                </VisualizationContext.Provider>
            </MemoryRouter>
        );
        
        expect(screen.getByText(/Hide/i)).toBeInTheDocument();
    });

    test('VisualizationTreeBubbleButton should be show Show', () => {
        const showBubble = false;
        const setShowBubble = jest.fn();

        render(
            <MemoryRouter>
                <VisualizationContext.Provider value={{ showBubble, setShowBubble }}>
                    <VisualizationTreeBubbleButton />
                </VisualizationContext.Provider>
            </MemoryRouter>
        )
        expect(screen.getByText(/Show/i)).toBeInTheDocument();
    });

    test('VisualizationTreeBubbleButton should be use the function setShowBubble when make click in a button', () => {
        const showBubble = false;
        const setShowBubble = jest.fn();

        render(
            <MemoryRouter>
                <VisualizationContext.Provider value={{ showBubble, setShowBubble }}>
                    <VisualizationTreeBubbleButton />
                </VisualizationContext.Provider>
            </MemoryRouter>
        );
        
        fireEvent.click(screen.getByText(/Show/i));
        expect(setShowBubble).toHaveBeenCalled();
    });
});