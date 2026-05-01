import express from "express";
// import cookieParser from "cookie-parser";
import fs from "fs/promises"
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4069;

// const arrayRandom = array => array[Math.floor(Math.random() * array.length)];

app.use(cors())
// app.use(cors({
//     origin: "http://dommy.com:8000",
//     credentials: true
// }));

// const dislike_svg = await fs.readFile('dislike.svg');
// const baddislike_svg = await fs.readFile('baddislike.svg');
// const hatelist_svg = (await fs.readFile('hatelist.svg')).toString();

// app.use(cookieParser());

// app.use(function (req, res, next) {
//     // // console.log(`foo, ${req.cookies.usr}`);
// 	const usr = req.cookies.usr || "Guests";
// 	req.usr = usr;
//     res.cookie("usr", usr, { maxAge: 90000000000, httpOnly: true, sameSite: 'none', secure: true });
// 	next();
// });

const saveState = async (orig) => {
    // console.log("saved state " + orig);
    // if (orig != "interval") throw new Error("wat");
    await fs.writeFile("saved.json", JSON.stringify(state));
}
const onexit = async () => {
    await saveState("onexit");
    process.exit(0);
}
process.on('SIGINT', () => onexit());
process.on('SIGTERM', () => onexit());
const loadState = async () => {
    try {
        const state = JSON.parse((await fs.readFile("saved.json")).toString());
        return state;
    } catch {
        // console.log("recreated state");
        return {
            dislikes_map: {},
            has_disliked_map: {},
            // user_states: {},
        }
    }
}

setInterval(() => saveState("interval"), 1000 * 10);

const state = await loadState();

function respond_dummy_image(res) {
	res.set("Content-Type", "image/svg+xml");
	res.set('Cache-Control', 'no-store');
	res.send(`<svg xmlns="http://www.w3.org/2000/svg" height="0" width="0"></svg>`);
}

app.get("/k/*splat", (req, res) => {
    const keycode = req.path.split("/").at(-1);
    console.log(keycode);
    res.statusCode = 204;
    res.send("foo");
});

app.listen(PORT, () => {
	console.log(`running on port ${PORT}`);
})