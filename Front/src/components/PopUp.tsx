import React from 'react'
import { useEffect } from 'react';

interface PopUpProps {
    close: () => void; 
    isTimed: boolean;
    title?: string;
    info: {
        name: string;
        content: React.ReactNode;
    };
}

const PopUp: React.FC<PopUpProps> = (props) => {

    const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
    };

    useEffect(() => {
        // Don't set up the interval if isTimed is false
        if (!props.isTimed) return; 

        // Close the popup after 5 seconds
        const timer = setTimeout(() => {
            props.close();
        }, 5000);

        // Cleanup function to prevent memory leaks if the user closes the popup
        return () => clearTimeout(timer);
    }, [props.isTimed, props.close]);

    const closePopUp = () => {
        props.close();
    }
    
    return (
    <div id='infoPopup' className='popUpOverlay' onClick={closePopUp}>
        <div className='popUpInfo'>
            <br />
            <div className='popUpContentLabel' onClick={handleContentClick}>
                <div className='popUpCloseLabel' onClick={closePopUp}>X</div>
                {props.info.content}
            </div>
        </div>
    </div>
    )
}

export default PopUp;
