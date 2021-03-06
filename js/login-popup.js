//////////////////
// LOGIN POPUP
/////////////////

const pageState = new PageState();
pageState.onStateChange((state) => renderFollowBar(state));
pageState.onFollowStateChange((followState) => renderFollowStateElements(followState));

let stt = 1;
let getCurrentFollowStateInterval = null;
let ip = null;
let user = null;

const getCurrentTab = (callback) => chrome.tabs.query({ active: true, windowId: chrome.windows.WINDOW_ID_CURRENT }, (tabs) => callback(tabs[0]));
const canStart = (followState) => followState == "idle";

/**
 * Lấy dữ liệu từ form
 */
const getRequestData = () => {
	let hanhkhachs = [];
	$(".hanh-khach .row").each(function () {
		if ($(this).find("#ho-ten").val() != "") {
			hanhkhachs.push({
				hoten: $(this).find("#ho-ten").val().trim(),
				gioitinh: $(this).find("#gioi-tinh").val(),
				ngaysinh: $(this).find("#ngay-sinh").val(),
				hldi: $(this).find("#hl-di").val(),
				hlve: $(this).find("#hl-ve").val(),
				check: $(this).find("#chon").prop("checked"),
			});
		}
	});

	return {
		auto_booking: $("#autoBooking").prop("checked"),
		fill_stop: $("#fillStop").prop("checked"),
		tenkhachhang: $("#tenkhachhang").val(),
		diachi: $("#diachi").val(),
		sdt: $("#sdt").val(),
		email: $("#email").val(),
		hanhkhach: hanhkhachs,
		action: "",
	};
};
/**
 * Điền thông tin theo từng tab
 * Render lại các giá trị của form tương ứng với dữ liệu state lấy từ background
 */
const renderFollowBar = (state) => {
	$("#autoBooking").prop("checked", state.request.auto_booking);
	$("#fillStop").prop("checked", state.request.fill_stop);

	$("#tenkhachhang").val(state.request.tenkhachhang);
	$("#diachi").val(state.request.diachi);
	$("#sdt").val(state.request.sdt);
	$("#email").val(state.request.email);

	renderListHanhKhach(state.request.hanhkhach);
	renderFollowStateElements(state.result.follow_state);
};

const renderListHanhKhach = (hanhkhachs) => {
	let s = "";
	for (let i = 0; i < hanhkhachs.length; i++) {
		stt = i + 1;
		s +=
			"<div class='row'><div class='col-xs-1 stt'>" +
			stt +
			"</div><div class='col-xs-3 ho-ten'><input type='text' id='ho-ten' class='form-control input-sm' placeholder='Họ tên' value='" +
			hanhkhachs[i].hoten +
			"' /></div>";

		s += "<div class='col-xs-2 gioi-tinh'><select id='gioi-tinh' class='form-control input-sm'>";
		s += '<option value="MR"' + (hanhkhachs[i].gioitinh == "MR" && "selected") + ">MR (Quý ông)</option>";
		s += '<option value="MRS"' + (hanhkhachs[i].gioitinh == "MRS" && "selected") + ">MRS (Quý bà)</option>";
		s += '<option value="MS"' + (hanhkhachs[i].gioitinh == "MS" && "selected") + ">MS (Quý cô)</option>";
		s += '<option value="MSTR"' + (hanhkhachs[i].gioitinh == "MSTR" && "selected") + ">MSTR (Bé trai)</option>";
		s += '<option value="MISS"' + (hanhkhachs[i].gioitinh == "MISS" && "selected") + ">MISS (Bé gái)</option>";
		s += '<option value="eMSTR"' + (hanhkhachs[i].gioitinh == "eMSTR" && "selected") + ">eMSTR (Em bé trai)</option>";
		s += '<option value="eMISS"' + (hanhkhachs[i].gioitinh == "eMISS" && "selected") + ">eMISS (Em bé gái)</option>";
		s += "</select></div>";

		s +=
			"<div class='col-xs-3 ngay-sinh'><input type='date' id='ngay-sinh' class='form-control input-sm' value='" +
			hanhkhachs[i].ngaysinh +
			"' /></div>";

		s += "<div class='col-xs-1 hl-di'><input type='number' id='hl-di' class='form-control input-sm' value='" + hanhkhachs[i].hldi + "' /></div>";
		s += "<div class='col-xs-1 hl-ve'><input type='number' id='hl-ve' class='form-control input-sm' value='" + hanhkhachs[i].hlve + "' /></div>";
		s +=
			"<div class='col-xs-1 chuc-nang'><input type='checkbox' id='chon' " +
			(hanhkhachs[i].check && "checked") +
			" /><button class='btn btn-xs btn-danger'>x</button></div></div>";
	}
	// Nếu có danh sách hành khách
	if (hanhkhachs.length > 0) {
		$(".hanh-khach").html("");
		$(".hanh-khach").html(s);
		$(".hanh-khach").on("click", "button", (e) => xoaHK(e));
	}
};

/**
 * Hiển thị trạng thái hoạt động của tool
 */
const renderFollowStateElements = (followState) => {
	$("#followStateMsg").text(Config.state[followState].title);
	$("#btnTriggerFollowMsg").text(canStart(followState) ? "Bắt đầu" : "Dừng lại");
	$("#btnThemHanhKhach").attr("disabled", !canStart(followState));
};

const triggerFollow = (state) => {
	getCurrentTab((tab) => {
		let request = new RequestDecorator(getRequestData()).withTab(tab).withStopFollowAction();
		if (canStart(state.result.follow_state)) request = request.withStartFollowAction();
		request = request.build();

		const ttlh = { tenkhachhang: request.tenkhachhang, diachi: request.diachi, email: request.email, sdt: request.sdt };
		chrome.storage.local.set({ ttlh });

		chrome.runtime.sendMessage(request, (response) => pageState.setState(response.state));
	});
};

const xoaHK = (e) => {
	e.target.closest(".row").remove();
	stt = 0;
	$(".stt").each((ind, elm) => $(elm).html(++stt));
};

const convertDate = (s) => {
	if (s === undefined) return s;
	const da = s.split("/");
	if (da.length !== 3) return s;

	const d = parseInt(da[0]);
	const m = parseInt(da[1]);
	const y = parseInt(da[2]);
	return y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d);
};

const login = ({ username, password }) => {
	$.ajax({
		url: Config.host.api + "login?username=" + username + "&password=" + password + "&ip=" + ip,
		method: "GET",
		dataType: "json",
		contentType: "application/json",
		success: (credential) => chrome.storage.local.set({ user: credential }, () => render()),
		error: (jqXHR) => jqXHR.responseJSON !== undefined && $("#errorMsg").text(jqXHR.responseJSON.message).show(),
	});
};

const showLogin = () => {
	$("#form-login").show();
	$("#welcome").hide();
	$("#input_username").val("");
	$("#input_password").val("");
	$("#errorMsg").text("").hide();
};

/**
 * Khi bật tool => render lại giao diện của tool
 */
const render = () => {
	if (getCurrentFollowStateInterval) clearInterval(getCurrentFollowStateInterval);
	chrome.storage.local.get("user", (data) => {
		if (data.user) {
			user = data.user;
			$("#welcome").show();
			$("#form-login").hide();
			$("#username").text(user.hoten);
			$("#songay").text(user.songay);

			getCurrentTab((tab) => {
				const url = tab.url;
				if (
					1 ||
					/vetot\.com\.vn/gi.test(url) ||
					/holavietnam\.com\.vn/gi.test(url) ||
					/muadi\.com\.vn/gi.test(url) ||
					/onlinebookingticket\.vn/gi.test(url) ||
					/onlineairticket\.vn/gi.test(url) ||
					/bookingticket\.vn/gi.test(url) ||
					/vnabooking/gi.test(url) ||
					/vietjetair/gi.test(url)
				) {
					$(".content").show();
					$("#error-page").hide();
					// Get state of current tab from background.js
					chrome.runtime.sendMessage({ action: "get-state", tab: tab }, (response) => {
						if (!response.state.tenkhachhang) {
							chrome.storage.local.get("ttlh", (data) => {
								if (data.ttlh) {
									response.state.request.tenkhachhang = data.ttlh.tenkhachhang;
									response.state.request.diachi = data.ttlh.diachi;
									response.state.request.sdt = data.ttlh.sdt;
									response.state.request.email = data.ttlh.email;
								}
								pageState.setState(response.state);
							});
						} else pageState.setState(response.state);
					});

					getCurrentFollowStateInterval = setInterval(() => {
						chrome.runtime.sendMessage({ action: "get-follow-state", tab: tab }, (response) =>
							pageState.setFollowState(response.follow_state)
						);
					}, 500);
				} else {
					$(".content").hide();
					$("#error-page").show();
				}
			});
		} else showLogin();
	});
};

$(document).ready(() => {
	render();

	// Ấn nút theo dõi
	///////////////////
	$("#btnTriggerFollow").on("click", () => {
		// check login user in server
		if (user !== null && user.token !== undefined && canStart(pageState.getState().result.follow_state)) {
			$("body").css("cursor", "progress");
			$.ajax({
				url: Config.host.api + "get-user",
				beforeSend: (xhr) => {
					xhr.setRequestHeader("Authorization", "Bearer " + user.token);
				},
				success: () => triggerFollow(pageState.getState()),
				error: () => showLogin(),
			}).always(() => $("body").css("cursor", "default"));
		} else triggerFollow(pageState.getState());
	});

	$("#btnLogin").on("click", (e) => {
		e.preventDefault();
		$("#errorMsg").hide();

		let username = $("#input_username").val().trim();
		let password = $("#input_password").val().trim();
		if (username === "admin" && password === "1") {
			// Default admin
			const defaultUser = {
				username: "admin",
				hoten: "Default Admin",
				songay: 99,
			};
			chrome.storage.local.set({ user: defaultUser }, () => render());
		} else
		if (ip !== null) login({ username, password });
		else $.getJSON("http://gd.geobytes.com/GetCityDetails", (data) => (ip = data.geobytesipaddress && login({ username, password })));
	});

	$("#btnLogout").on("click", (e) => {
		e.preventDefault();

		var username = "";
		chrome.storage.local.get("user", (data) => {
			if (data.user) {
				username = data.user.username;
				$.ajax({
					url: Config.host.api + "logout?username=" + username,
					method: "GET",
					dataType: "json",
					contentType: "application/json",
					// data: JSON.stringify({username, password})
				});
			}
		});

		chrome.storage.local.set({ user: null }, render);
	});

	$("#tenkhachhang").on("paste", (e) => {
		e.preventDefault();
		// access the clipboard using the api
		var pastedData = e.originalEvent.clipboardData.getData("text");
		let data = pastedData.split("\t");
		$("#tenkhachhang").val(data[0]);
		$("#sdt").val(data[1]);
		$("#diachi").val(data[2]);
		$("#email").val(data[3]);
	});

	$("#btnXoaHanhKhach").on("click", (e) => xoaHK(e));

	$("#btnThemHanhKhach").on("click", (e) => {
		e.preventDefault();
		$(".hanh-khach").append(
			"<div class='row'><div class='col-xs-1 stt'>" +
				++stt +
				"</div>" +
				"<div class='col-xs-3 ho-ten'><input type='text' id='ho-ten' class='form-control input-sm' placeholder='Họ tên' /></div>" +
				"<div class='col-xs-2 gioi-tinh'><select id='gioi-tinh' class='form-control input-sm'><option value='MR'>MR (Quý ông)</option><option value='MRS'>MRS (Quý bà)</option><option value='MS'>MS (Quý cô)</option><option value='MSTR'>MSTR (Bé trai)</option><option value='MISS'>MISS (Bé gái)</option><option value='eMSTR'>eMSTR (Em bé trai)</option><option value='eMISS'>eMISS (Em bé gái)</option></select></div>" +
				"<div class='col-xs-3 ngay-sinh'><input type='date' id='ngay-sinh' class='form-control input-sm' /></div>" +
				"<div class='col-xs-1 hl-di'><input type='number' id='hl-di' class='form-control input-sm' /></div>" +
				"<div class='col-xs-1 hl-ve'><input type='number' id='hl-ve' class='form-control input-sm' /></div>" +
				"<div class='col-xs-1 chuc-nang'><input type='checkbox' id='chon' checked /><button class='btn btn-xs btn-danger'>x</button></div></div>"
		);
		$(".hanh-khach").on("click", "button", (e) => xoaHK(e));
	});

	$("#txtExcel").on("paste", (e) => {
		e.preventDefault();
		$("body").css("cursor", "progress");
		// access the clipboard using the api
		let text = e.originalEvent.clipboardData.getData("text");

		// Chờ xử lý trên web
		//
		$.ajax({
			url: Config.host.api + "parcel",
			contentType: "application/json",
			beforeSend: (xhr) => {
				xhr.setRequestHeader("Authorization", "Bearer " + user.token);
			},
			data: { text },
			success: (response) => response.success && renderListHanhKhach(response.data),
			error: () => showLogin(),
		}).always(() => $("body").css("cursor", "default"));
	});

	$("#btnExcelHelp").on("click", (e) =>
		alert(
			"Copy nội dung từ file excel dán vào ô bên cạnh để xử lý.\n" +
				"Các cột trong Excel:\n1. Họ tên\n2. Giới tính: MR, MRS, MS, MSTR, MISS, eMSTR, eMISS\n3. Ngày sinh (dạng dd/mm/yyyy hoặc yyyy-mm-dd)\n4. Hành lý đi\n5. Hành lý về"
		)
	);
}); // End ready
