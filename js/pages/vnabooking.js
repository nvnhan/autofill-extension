/**
 * VNABooking & Onlineticket
 */
const vnabooking = () => {
	const start = () => {
		const request = pageState.getState().request;
		const req = new RequestDecorator(request).withFillingAction().build(); // Gửi request về background
		chrome.runtime.sendMessage(req, (response) => $("#button-book button")[0].click()); // Click tiếp tục để đến trang fill
	};

	const fill = () => {
		const request = pageState.getState().request;

		$("#InfoPassener_Email").val(request.email);
		$("#InfoPassener_Phone").val(request.sdt);

		let cnt = 0;
		let cntA = parseInt($("select#adult").val());
		let cntC = cntA + parseInt($("select#child").val());
		let cntI = cntC + parseInt($("select#infant").val());
		request.hanhkhach.forEach((value, ind) => {
			if (!value.check || cnt >= cntI) return;
			if ($(`#InfoPassener_Passengers_${cnt}__Gender`).length > 0) {
				if (
					(cnt < cntA && checkAdult(value)) ||
					(cnt < cntC && checkChild(value)) ||
					(cnt < cntI && checkInfant(value))
				) {
					$(`#InfoPassener_Passengers_${cnt}__Gender`).val(
						checkInfant(value) ? value.gioitinh.substring(1) : value.gioitinh
					);
					$(`#InfoPassener_Passengers_${cnt}__Name`).val(value.hoten);

					if (checkInfant(value))
						// Fill Infant birthday
						$(`#InfoPassener_Passengers_${cnt}__Brith_Brithday`).val(value.ngaysinh.replace(/-/g, "/"));

					//TODO: Hành lý ký gửi đối vói một số hãng bay nhất định

					cnt++;
					request.hanhkhach[ind].check = false;
				}
			}
		});

		setTimeout(() => {
			const req = new RequestDecorator(request).withStopFollowAction().build(); // Gửi request về background
			chrome.runtime.sendMessage(req, () => request.auto_booking && $(".card-footer:first .btn-lg")[0].click()); // Click tiếp tục
		}, 4000);
	};

	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		switch (request.state.request.action) {
			case "start-fill":
				pageState.setState(request.state);
				start();
				return sendResponse();
		}
	});

	loadCurrentStateTab((state) => {
		switch (state.result.follow_state) {
			case "filling":
				fill();
				break;
			default:
		}
	});
};
