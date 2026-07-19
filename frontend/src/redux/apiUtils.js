export const DEMO_BACKEND_API = import.meta.env.MODE === 'development' ? '' : window.location.origin;

export async function checkAndReturnRes(res) {
    const data = await res.json();
    let check = false
    if(res.ok) {
        console.log("RES OK", data);
        check = true
    } else {
        console.log("RES ERROR", data);
    };

    return {ok: check, data}
}