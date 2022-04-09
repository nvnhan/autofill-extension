////////////////////////////////
// SCRIPT ĐƯỢC CHÈN VÀO TRANG WEB
// NHẬN VÀ PHẢN HỒI REQUEST TỪ TOOL
// XỬ LÝ CÁC NGHIỆP VỤ CHÍNH
//////////////////////////////////

const url = window.location.href;
const pageState = new PageState();

const checkChild = (hanhkhach) => hanhkhach.gioitinh == "MISS" || hanhkhach.gioitinh == "MSTR";
const checkInfant = (hanhkhach) => hanhkhach.gioitinh == "eMISS" || hanhkhach.gioitinh == "eMSTR";
const checkAdult = (hanhkhach) => !checkChild(hanhkhach) && !checkInfant(hanhkhach);
const checkCheck = (hanhkhach) => hanhkhach.check;

const convertDate = (s) => {
	const ar = s.split("-");
	return ar[2] + "/" + ar[1] + "/" + ar[0];
};

const loadCurrentStateTab = (callback) => {
	chrome.runtime.sendMessage(
		{
			action: "get-state",
		},
		(response) => {
			pageState.setState(response.state);
			callback && callback(response.state);
		}
	);
};

$(document).ready(() => {
	if (/muadi\.com\.vn/gi.test(url) || /onlinebookingticket\.vn/gi.test(url)) {
		console.log("apply muadi.com.vn & onlinebookingticket.vn");
		muadi();
	} else if (/onlineairticket\.vn/gi.test(url) || /bookingticket\.vn/gi.test(url)) {
		console.log("apply onlineairticket & bookingticket.vn");
		onlineAirTicket();
	} else if (/vnabooking/gi.test(url) || /onlineticket/gi.test(url)) {
		console.log("apply vnabooking & onlineticket");
		vnabooking();
	} else if (/vietjetair/gi.test(url)) {
		console.log("apply vietjetair.com");
		vj();
	} else if (/xuatve/gi.test(url)) {
		console.log("apply xuatve.vn");
		xuatve();
	} else if (/bambooairways/gi.test(url)) {
		console.log("apply bambooairways.com");
		bb();
	} else if (/fly\.vietnamairlines\.com/gi.test(url)) {
		console.log("apply fly.vietnamairlines.com");
		vna();
	}
});
