# Function enableMapHover

enableMapHover(debounceTime?): void
if called, mouse coordinates will be dispatched to the SDK app and can be accessed via the state key mapHoverCoords.

Parameters
    debounceTime: number = 20
the time in ms to debounce the incoming messages to the SDK app.

Returns void