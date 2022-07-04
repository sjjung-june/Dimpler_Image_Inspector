const root = document.documentElement;
const file_input = document.querySelector(".file-input");
const img = document.createElement("img");

const canvas = document.querySelector(".canvas");
const ctx = canvas.getContext("2d");

const profile_width = document.querySelector(".profile-width");
const profile_avg = document.querySelector(".profile-avg");
const det_peak = document.querySelector(".det_peak");
const det_valley = document.querySelector(".det_valley");

const server_url = "http://10.138.126.181:5000";
const SCALE_IMAGE = 0.5;

const mouse = {
  move_x: 0,
  move_y: 0,
  down_x: 0,
  up_x: 0,
  down_y: 0,
  up_y: 0,
  drag: false,
};

det_peak.checked = true;

function uploadFile() {
  let xhr = new XMLHttpRequest();
  let formData = new FormData();
  let file = file_input.files[0];

  xhr.open("POST", `${server_url}/upload`);
  xhr.onload = function () {
    img.src = `${server_url}/static/images/${xhr.response}`;

    img.addEventListener("load", () => {
      canvas.height = img.height;
      canvas.width = img.width;

      ctx.drawImage(img, 0, 0);
      canvas.height = img.height * SCALE_IMAGE;
      canvas.width = img.width * SCALE_IMAGE;

      bounds = canvas.getBoundingClientRect();
      canvas.classList.add("loaded");
      update();

      canvas.addEventListener("mousedown", mousedownHandler);
      canvas.addEventListener("mouseup", mouseupHandler);
      canvas.addEventListener("mousemove", mousemoveHandler);
    });
  };

  formData.append("file", file);
  xhr.send(formData);
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, img.width * SCALE_IMAGE, img.height * SCALE_IMAGE);
}

function mousedownHandler(event) {
  update();
  mouse.drag = true;
  mouse.down_x = event.pageX - bounds.left;
  mouse.down_y = event.pageY - bounds.top;

  ctx.beginPath();
  ctx.moveTo(mouse.down_x, mouse.down_y);
}

function mouseupHandler(event) {
  mouse.drag = false;
  mouse.up_x = event.pageX - bounds.left;
  mouse.up_y = event.pageY - bounds.top;

  ctx.lineTo(mouse.up_x, mouse.up_y);
  ctx.stroke();

  ctx.fillStyle = "red";
  ctx.fillRect(mouse.up_x - 2, mouse.up_y - 2, 4, 4);

  getProfile(
    img,
    mouse.down_x,
    mouse.down_y,
    mouse.up_x,
    mouse.up_y,
    Number(profile_width.value),
    Number(profile_avg.value),
    det_peak.checked ? 1 : -1
  );
}

function mousemoveHandler(event) {
  mouse.move_x = event.pageX - bounds.left;
  mouse.move_y = event.pageY - bounds.top;

  if (mouse.drag === true) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, img.width * SCALE_IMAGE, img.height * SCALE_IMAGE);
    ctx.beginPath();
    ctx.moveTo(mouse.down_x, mouse.down_y);
    ctx.lineTo(mouse.move_x, mouse.move_y);
    ctx.stroke();
    ctx.fillStyle = "red";
    ctx.fillRect(mouse.down_x - 2, mouse.down_y - 2, 4, 4);
  }
}

function getProfile(img, x0, y0, x1, y1, dist, smooth, method) {
  const arr = {
    img: img.src,
    start_pos: [x0 / SCALE_IMAGE, y0 / SCALE_IMAGE],
    end_pos: [x1 / SCALE_IMAGE, y1 / SCALE_IMAGE],
    dist: dist,
    smooth: smooth,
    method: method,
  };

  let xhr = new XMLHttpRequest();
  xhr.open("POST", `${server_url}/profile`);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onload = function () {
    profile_data = JSON.parse(xhr.response);
    profile_x = profile_data["profile_x"];
    profile_y = profile_data["profile_y"];
    peak_x = profile_data["peak_x"];
    peak_y = profile_data["peak_y"];
    plotProfile(profile_x, profile_y, peak_x, peak_y);
  };
  console.log(arr);
  xhr.send(JSON.stringify(arr));
}

function plotProfile(profile_x, profile_y, peak_x, peak_y) {
  var myPlot = document.getElementById("myChart");

  var Peaks = {
    x: peak_x,
    y: peak_y,
    mode: "markers",
    marker: {
      color: "rgb(255,0,0)",
    },
    name: `Peaks (${peak_x.length})`,
  };

  var Profile = {
    x: profile_x,
    y: profile_y,
    mode: "lines",
    line: {
      color: "rgba(0,0,0,0.2)",
    },
    name: "Profile",
  };

  var data = [Profile, Peaks];
  var layout = {};
  var config = { responsive: false, displayModeBar: false };
  Plotly.newPlot("myChart", data, layout, config);

  myPlot.on("plotly_click", function (data) {
    if (data.points[0].curveNumber == 1) {
      const arr = {
        profile_x: profile_x,
        profile_y: profile_y,
        peak_x: peak_x,
        peak_y: peak_y,
        peak: data.points[0].x,
      };

      let xhr = new XMLHttpRequest();
      xhr.open("POST", `${server_url}/profile/delete`);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onload = function () {
        profile_data = JSON.parse(xhr.response);
        profile_x = profile_data["profile_x"];
        profile_y = profile_data["profile_y"];
        peak_x = profile_data["peak_x"];
        peak_y = profile_data["peak_y"];
        plotProfile(profile_x, profile_y, peak_x, peak_y);
      };

      xhr.send(JSON.stringify(arr));
    } else {
      const arr = {
        profile_x: profile_x,
        profile_y: profile_y,
        peak_x: peak_x,
        peak_y: peak_y,
        new_peak_x: data.points[0].x,
        new_peak_y: data.points[0].y,
      };

      let xhr = new XMLHttpRequest();
      xhr.open("POST", `${server_url}/profile/add`);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onload = function () {
        profile_data = JSON.parse(xhr.response);
        profile_x = profile_data["profile_x"];
        profile_y = profile_data["profile_y"];
        peak_x = profile_data["peak_x"];
        peak_y = profile_data["peak_y"];
        plotProfile(profile_x, profile_y, peak_x, peak_y);
      };

      xhr.send(JSON.stringify(arr));
    }
  });
}

file_input.addEventListener("change", uploadFile);
