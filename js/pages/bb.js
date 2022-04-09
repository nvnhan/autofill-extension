/**
 * Bambooairway.com
 */
const bb = () => {
	const start = () => {
		const request = pageState.getState().request;
		const req = new RequestDecorator(request).withFillingAction().build(); // Gửi request về background
		chrome.runtime.sendMessage(req, () => $("#proceed")[0].click()); // Click tiếp tục để đến trang fill
	};

	const fill = () => {
		const request = pageState.getState().request;
		$("#contact-suffix").val("MR");
		$("#contact-surname").val(request.tenkhachhang.split(" ")[0]);
		$("#contact-firstname").val(request.tenkhachhang.split(" ").slice(1).join(" "));
		$("#contact-phone-number").val(request.sdt);
		$("#contact-email").val(request.email);
		$("#contact-street").val(request.diachi);
		$("#contact-city").val(request.diachi);

		let cntA = 0;
		let cntC = 0;
		let cntI = 0;
		request.hanhkhach.forEach((value, ind) => {
			if (!value.check) return;
			if (checkAdult(value) && $("#passengerAdult-" + cntA + "-suffix").length > 0) {
				$("#passengerAdult-" + cntA + "-suffix").val(value.gioitinh);
				$("#passengerAdult-" + cntA + "-surname").val(value.hoten.split(" ")[0]);
				$("#passengerAdult-" + cntA + "-firstname").val(value.hoten.split(" ").slice(1).join(" "));
				cntA++;
				request.hanhkhach[ind].check = false;
			} else if (checkChild(value) && $("#passengerChild-" + cntC + "-suffix").length > 0) {
				$("#passengerChild-" + cntC + "-suffix").val(value.gioitinh);
				$("#passengerChild-" + cntC + "-surname").val(value.hoten.split(" ")[0]);
				$("#passengerChild-" + cntC + "-firstname").val(value.hoten.split(" ").slice(1).join(" "));
				$("#passengerChild-" + cntC + "-dob").val(convertDate(value.ngaysinh));
				$("#passengerChild-" + cntC + "-birthday").remove(); //val(convertDate(value.ngaysinh));
				$("<input />")
					.attr("id", "#passengerChild-" + cntC + "-birthday")
					.attr("name", "tempChildsDOB")
					.attr("value", convertDate(value.ngaysinh))
					.appendTo("#createItineraryConfirmForm");
				cntC++;
				request.hanhkhach[ind].check = false;
			} else if (checkInfant(value) && $("#passengerInfant-" + cntI + "-suffix").length > 0) {
				$("#passengerInfant-" + cntI + "-suffix").val(value.gioitinh.substring(1));
				$("#passengerInfant-" + cntI + "-surname").val(value.hoten.split(" ")[0]);
				$("#passengerInfant-" + cntI + "-firstname").val(value.hoten.split(" ").slice(1).join(" "));
				$("#passengerInfant-" + cntI + "-dob").val(convertDate(value.ngaysinh));
				$("#passengerInfant-" + cntI + "-birthday").remove(); //val(convertDate(value.ngaysinh));
				$("<input />")
					.attr("id", "#passengerInfant-" + cntC + "-birthday")
					.attr("name", "tempInfantsDOB")
					.attr("value", convertDate(value.ngaysinh))
					.appendTo("#createItineraryConfirmForm");
				cntI++;
				request.hanhkhach[ind].check = false;
			}
		});

		setTimeout(() => {
			if (request.fill_stop) {
				let req = new RequestDecorator(request).withStopFollowAction().build(); // Dừng lại
				chrome.runtime.sendMessage(req);
			} else {
				let req = new RequestDecorator(request).withFilledAction().build(); // Gửi request về background
				chrome.runtime.sendMessage(req, () => $("#proceed")[0].click()); // Click tiếp tục
			}
		}, 2000);
	};

	const otherAction = () => {
		const request = pageState.getState().request;
		$(".extra-checkbox")[1].click();

		//TODO: Check hành lý

		const req = new RequestDecorator(request).withRedirectedAction().build();
		chrome.runtime.sendMessage(req, () => $("#proceed")[0].click());
	};

	const tickPayments = () => {
		const req = pageState.getState().request;
		let request = new RequestDecorator(req).withStopFollowAction().build();

		if ($("#idPL").length) {
			// Nếu có thanh toán sau thì ấn nút
			$("#idPL").click();
			chrome.runtime.sendMessage(request, () => req.auto_booking && $("#overlay-PayLater-b2b button")[1].click());
		} else chrome.runtime.sendMessage(request);
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
			case "filled":
				otherAction();
				break;
			case "redirected":
				tickPayments();
				break;
			default:
		}
	});
};
