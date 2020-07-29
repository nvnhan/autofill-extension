///////////////////////////
// SCRIPT Ở TOOL BACKGROUND
// NHẬN DỮ LIỆU TỪ SCRIPT ĐƯỢC CHÈN VÀO WEB GỬI VỀ
// XỬ LÝ VÀ THÔNG BÁO TỚI USER
///////////////////////

chrome.storage.local.set({ user: null, ttlh: null });

const data = {};

const defaultInitState = {
	request: {
		auto_booking: false,
		tenkhachhang: "",
		diachi: "",
		sdt: "",
		email: "",
		hanhkhach: [],
	},
	result: {
		follow_state: "idle",
	},
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	let tabId = request.tab ? request.tab.id : sender.tab.id;

	if (!data[tabId]) data[tabId] = defaultInitState;

	switch (request.action) {
		case "get-follow-state":
			return sendResponse({ follow_state: data[tabId].result.follow_state });
		case "start-fill":
			data[tabId] = Object.assign({}, data[tabId], { request: request }, { result: { follow_state: "waiting" } });
			console.log("start fill with data", data[tabId]);
			// Send data (state) cho script.js ở tab tương ứng
			chrome.tabs.sendMessage(tabId, { state: data[tabId] }, () => {});
			return sendResponse({ state: data[tabId] });
		case "stop-fill":
			data[tabId] = Object.assign({}, data[tabId], { request: request }, { result: { follow_state: "idle" } });
			chrome.tabs.sendMessage(tabId, { state: data[tabId] }, () => {});
			return sendResponse({ state: data[tabId] });
		case "get-state":
			sendResponse({ state: data[tabId] });
			break;
		case "confirm":
			data[tabId] = Object.assign({}, data[tabId], { request: request }, { result: { follow_state: "confirm" } });
			break;
		case "final-confirm":
			data[tabId] = Object.assign({}, data[tabId], { request: request }, { result: { follow_state: "final-confirm" } });
			break;
		case "set-state":
			console.log("set state", request);
			data[tabId] = Object.assign({}, data[tabId], { request: request });
			break;
		case "filling":
			console.log("filling bg");
			data[tabId] = Object.assign({}, data[tabId], { request: request }, { result: { follow_state: "filling" } });
			sendResponse({ state: data[tabId] });
			break;
		case "filled":
			console.log("filled bg");
			data[tabId] = Object.assign({}, data[tabId], { request: request }, { result: { follow_state: "filled" } });
			sendResponse({ state: data[tabId] });
			break;
		// Tool VietJet
		case "redirected":
			console.log("redirected bg");
			data[tabId] = Object.assign({}, data[tabId], { request: request }, { result: { follow_state: "redirected" } });
			sendResponse({ state: data[tabId] });
			break;
		case "dangerous_goods":
			console.log("confirmed dangerous_goods bg");
			data[tabId] = Object.assign({}, data[tabId], { request: request }, { result: { follow_state: "dangerous_goods" } });
			sendResponse({ state: data[tabId] });
			break;
		case "confirmed_order":
			console.log("confirmed_order bg");
			data[tabId] = Object.assign({}, data[tabId], { request: request }, { result: { follow_state: "confirmed_order" } });
			sendResponse({ state: data[tabId] });
			break;
		case "done":
			console.log("done bg");
			data[tabId] = Object.assign({}, data[tabId], { request: request }, { result: { follow_state: "done" } });
			sendResponse({ state: data[tabId] });
			break;
	}
});
