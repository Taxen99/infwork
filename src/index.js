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
        return defaultState();
    }
}
const defaultState = () => {
    return {
        lines: [""],
        cursor: { line: 0, col: 0 },
    };
}

setInterval(() => saveState("interval"), 1000 * 10);

const state = await loadState();

function respond_dummy_image(res) {
	res.set("Content-Type", "image/svg+xml");
	res.set('Cache-Control', 'no-store');
	res.send(`<svg xmlns="http://www.w3.org/2000/svg" height="0" width="0"></svg>`);
}

const asFunctionKey = code => {
    return code.match(/^F(\d\d?)$/)?.[1] || null;
}
const asRegularKey = code => {
    if (code.length === 1) return code;
    if (code === "ah") return "å";
    if (code === "eh") return "ä";
    if (code === "oh") return "ö";
    if (code === "lt") return "<";
    if (code === "comma") return ",";
    if (code === "punkt") return ".";
    if (code === "hyph") return "-";
    if (code === "apo") return "'";
    if (code === "tick") return "´";
    if (code === "+") return "+";
    if (code === "deg") return "§";
    return null;
}
const asArrow = code => {
    return code.match(/^(\w)arrow$/)?.[1] || null;
}

function handleKeyEvent(code) {
    if (code === "uarrow") {
        state.cursor.line -= 1;
        if (state.cursor.line < 0)
            state.cursor = { line: 0, col: 0 };
    }
    if (code === "darrow") {
        state.cursor.line += 1;
        if (state.cursor.line > state.lines.length - 1)
            state.cursor = { line: state.lines.length - 1, col: state.lines.at(-1).length };
    }
    if (code === "larrow") {
        state.cursor.col -= 1;
        if (state.cursor.col < 0) {
            const newLine = Math.max(state.cursor.line - 1, 0);
            state.cursor = { line: newLine, col: state.lines[newLine].length };
        }
    }
    if (code === "rarrow") {
        state.cursor.col += 1;
        if (state.cursor.col > state.lines[state.cursor.line].length) {
            const newLine = Math.min(state.cursor.line + 1, state.lines.length - 1);
            state.cursor = { line: newLine, col: state.cursor.line === state.lines.length - 1 ? state.lines.at(-1).length : 0 };
        }
    }
    const reg = asRegularKey(code);
    if (reg !== null) {
        state.lines[state.cursor.line] = state.lines[state.cursor.line].split("").toSpliced(state.cursor.col, 0, reg).join("");
        state.cursor.col += 1;
    }
    if (code === "back") {
        if (state.cursor.col > 0) {
            state.lines[state.cursor.line] = state.lines[state.cursor.line].split("").toSpliced(state.cursor.col - 1, 1).join("");
            state.cursor.col -= 1;
        } else if (state.cursor.line > 0) {
            const oldLine = state.cursor.line;
            handleKeyEvent("larrow");
            state.lines.splice(oldLine, 1);
        }
    }
    if (code === "enter") {
        const curLine = state.lines[state.cursor.line];
        const preLine = curLine.slice(0, state.cursor.col);
        const postLine = curLine.slice(state.cursor.col);
        state.lines[state.cursor.line] = preLine;
        state.lines.splice(state.cursor.line, 0, postLine);
        handleKeyEvent("rarrow");
    }
}

const genSvgForState = () => {
    return `<svg xmlns="http://www.w3.org/2000/svg" height="${state.lines.length + 2}lh" width="500px">
    <style>
        text {
            font-family: 'Courier New', Courier, monospace;
        }
    </style>
    ${state.lines.map((line, i) => `<text y="${i + 1}lh">${line}</text>`)};
    </svg>`;
}

function sendState(res, content) {
    // client.write(`Content-Type: image/svg+xml\r\n\r\n${content}\r\n--endofsection\r\n`);
    res.write(content);
	res.write(`--endofsection\n`);
	res.write(`Content-Type:image/svg+xml\n\n`);
}

const clients = [];

setInterval(() => console.log(`${clients.length} clients alive`), 1000);

app.get("/k/*splat", (req, res) => {
    const keycode = req.path.split("/").at(-1);
    console.log(keycode);
    handleKeyEvent(keycode);
    res.statusCode = 204;
    res.send("foo");

    const content = genSvgForState();
    for (const client of clients) {
        sendState(client, content);
    }
});

app.get("/s", (req, res) => {
    res.writeHead(200, {
		'Cache-Control': 'no-store, no-cache, must-revalidate, pre-check=0, post-check=0, max-age=0',
		Pragma: 'no-cache',
		Connection: 'close',
		'Content-Type': 'multipart/x-mixed-replace; boundary=--endofsection'
	});
    // res.flushHeaders();
    
    // sendState(res, genSvgForState());

    res.write(`Content-Type:image/svg+xml\n\n`);
	res.write(genSvgForState());
	res.write(`--endofsection\n`);

    res.write(`Content-Type:image/svg+xml\n\n`);
    res.write(genSvgForState());
	res.write(`--endofsection\n`);
	res.write(`Content-Type:image/svg+xml\n\n`);

    clients.push(res);
    req.on("close", () => {
        console.log("closed?");
        res.end("fooo");
        clients.splice(clients.indexOf(res), 1);
    })
});

app.listen(PORT, () => {
	console.log(`running on port ${PORT}`);
})

console.log("TODO: use compression!!!!");
console.warn("TODO: use compression!!!!");