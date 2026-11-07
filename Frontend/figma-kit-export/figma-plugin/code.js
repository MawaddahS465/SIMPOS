// Import screenshot SIMPOS jadi frame Figma, tersusun per role.
// Dipanggil dari ui.html lewat pesan batch.

figma.showUI(__html__, { width: 460, height: 420, themeColors: true });

var GAP = 140;
var HEAD_GAP = 130;
var created = [];
var cursorY = 0;

function base64ToBytes(b64) {
  if (typeof atob === "function") {
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  var T = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var clean = b64.replace(/[^A-Za-z0-9+/]/g, "");
  var pad = b64.indexOf("=") >= 0 ? (b64.length - b64.indexOf("=")) : 0;
  var len = Math.floor((clean.length * 3) / 4) - pad;
  var bytes = new Uint8Array(len);
  var p = 0;
  for (var j = 0; j < clean.length; j += 4) {
    var c0 = T.indexOf(clean[j]);
    var c1 = T.indexOf(clean[j + 1]);
    var c2 = T.indexOf(clean[j + 2]);
    var c3 = T.indexOf(clean[j + 3]);
    bytes[p++] = (c0 << 2) | (c1 >> 4);
    if (c2 >= 0) bytes[p++] = ((c1 & 15) << 4) | (c2 >> 2);
    if (c3 >= 0) bytes[p++] = ((c2 & 3) << 6) | c3;
  }
  return bytes;
}

var ROLE_ORDER = ["Kasir", "Admin Cabang", "Pemilik", "Mobile"];

function roleOf(name) {
  if (name.indexOf("Kasir") >= 0) return "Kasir";
  if (name.indexOf("Admin") >= 0) return "Admin Cabang";
  if (name.indexOf("Pemilik") >= 0) return "Pemilik";
  return "Mobile";
}

async function makeFrame(file) {
  var bytes = base64ToBytes(file.b64);
  var image = figma.createImage(bytes);
  var size = image.getSize();

  var frame = figma.createFrame();
  frame.name = file.name.replace(/\.png$/i, "");
  frame.resize(size.width, size.height);
  frame.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: image.hash }];
  frame.clipsContent = true;
  return { node: frame, w: size.width, h: size.height, role: roleOf(file.name) };
}

async function makeHeading(text, y) {
  var t = figma.createText();
  t.fontName = { family: "Inter", style: "Bold" };
  t.characters = text;
  t.fontSize = 96;
  t.fills = [{ type: "SOLID", color: { r: 0.25, g: 0.25, b: 0.6 } }];
  t.x = 0;
  t.y = y;
  return t;
}

async function layout() {
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  // Kelompokkan per role, urut sesuai nama file.
  var order = [];
  var groups = {};
  created.sort(function (a, b) {
    return a.node.name.localeCompare(b.node.name, "id", { numeric: true });
  });
  created.forEach(function (f) {
    if (!groups[f.role]) {
      groups[f.role] = [];
      order.push(f.role);
    }
    groups[f.role].push(f);
  });

  order.sort(function (a, b) {
    return ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b);
  });

  var y = 0;
  for (var gi = 0; gi < order.length; gi++) {
    var role = order[gi];
    var items = groups[role];
    var perRow = items[0].w < 600 ? 6 : 3;
    var col = 0;
    var rowY = y + HEAD_GAP;
    var rowH = 0;

    for (var i = 0; i < items.length; i++) {
      var f = items[i];
      if (col >= perRow) {
        rowY += rowH + GAP;
        rowH = 0;
        col = 0;
      }
      f.node.x = col * (items[0].w + GAP);
      f.node.y = rowY;
      rowH = Math.max(rowH, f.h);
      col++;
    }

    await makeHeading(role, y);
    y = rowY + rowH + GAP * 1.4;
  }
}

figma.ui.onmessage = async function (msg) {
  if (msg.type === "batch") {
    for (var i = 0; i < msg.files.length; i++) {
      created.push(await makeFrame(msg.files[i]));
    }
    figma.ui.postMessage({ type: "progress", done: created.length });
    return;
  }

  if (msg.type === "done") {
    await layout();
    if (created.length) {
      figma.currentPage.selection = created.map(function (f) { return f.node; });
      figma.viewport.scrollAndZoomIntoView(figma.currentPage.selection);
    }
    figma.ui.postMessage({ type: "finished", total: created.length });
  }
};
