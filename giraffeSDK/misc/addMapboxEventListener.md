# Function addMapboxEventListener

addMapboxEventListener(eventType, debounceTime?, layerIds?): void
add a listener to mapbox events. See Mapbox docs for options

Parameters
    eventType: keyof MapEvents
    debounceTime: number = 20
    <Optional> layerIds: string | string[]
Returns void

[Link](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#on)

### Example

function App() {
  const callbackId = useRef();

  return (
    <div>
      <button
        onClick={() => {
          if (callbackId.current) {
            rpc.invoke("removeMapboxEventListener", [callbackId.current]);
          }
          rpc.invoke("addMapboxEventListener", ["mousedown", 100]).then(r => {
            callbackId.current = r;
          });
          giraffeState.addListener(["mapboxEvent"], (evt, { data: dataS }) => {
            console.log({ evt, data: JSON.parse(dataS) });
          });
        }}
      >
        add listener
      </button>
      <button
        onClick={() => {
          rpc.invoke("removeMapboxEventListener", [callbackId.current]);
        }}
      >
        remove listener
      </button>
    </div>
  );
}