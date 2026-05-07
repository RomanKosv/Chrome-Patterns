
export type RealtimeAction =
    (    
        {
            actionType : 'click';
            event: PointerEvent
        }
        | never
    )
    & {
        window : Window
    }

