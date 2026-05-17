
export type RealtimeAction =
    (    
        {
            actionType : 'click';
            event: PointerEvent
        } | {
            actionType : 'input_text',
            event : InputEvent
        }
    )
    & {
        window : Window
    }

