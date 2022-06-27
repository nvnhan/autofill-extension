/**
 * Muadi.com.vn
 * Find by Price
 */
const muadi = () => {
	const start = () => {
		const request = pageState.getState().request;
		const req = new RequestDecorator(request).withFillingAction().build(); // Gửi request về background
		chrome.runtime.sendMessage(req, (response) => $("#ChildPage_ListBooking_btnSubmit")[0].click()); // Click tiếp tục để đến trang fill
	};

	const fill = () => {
		const request = pageState.getState().request;
		let isFail = $("#ChildPage_ListBooking_divShowError").length > 0;
		if (isFail) {
			const req = new RequestDecorator(request).withStopFollowAction().build();
			chrome.runtime.sendMessage(req, (response) => {});
		} else {
			setTimeout(() => {
				$("#ctl10_txtCustomerName").val(request.tenkhachhang);
				$("#ctl10_txtCustomerAddress").val(request.diachi);
				$("#ChildPage_ctl10_txtCustomerPhone").val(request.sdt);
				$("#ChildPage_ctl10_txtCustomerEmail").val(request.email);

				let cntA = 1;
				let cntC = 1;
				let cntI = 1;
				request.hanhkhach.forEach((value, ind) => {
					if (!value.check) return;
					if (checkAdult(value) && $("#firstname_adt_" + cntA).length > 0) {
						$("#title_adt_" + cntA).val(value.gioitinh.toLowerCase());
						$("#firstname_adt_" + cntA).val(value.hoten.split(" ")[0]);
						$("#lastname_adt_" + cntA).val(value.hoten.split(" ").slice(1).join(" "));
						cntA++;
						request.hanhkhach[ind].check = false;
					} else if (checkChild(value) && $("#firstname_chd_" + cntC).length > 0) {
						$("#title_chd_" + cntC).val(value.gioitinh.toLowerCase());
						$("#firstname_chd_" + cntC).val(value.hoten.split(" ")[0]);
						$("#lastname_chd_" + cntC).val(value.hoten.split(" ").slice(1).join(" "));
						$("#birthday_chd_" + cntI).val(convertDate(value.ngaysinh));
						cntC++;
						request.hanhkhach[ind].check = false;
					} else if (checkInfant(value) && $("#firstname_inf_" + cntI).length > 0) {
						$("#title_inf_" + cntI).val(value.gioitinh.substring(1).toLowerCase());
						$("#firstname_inf_" + cntI).val(value.hoten.split(" ")[0]);
						$("#lastname_inf_" + cntI).val(value.hoten.split(" ").slice(1).join(" "));
						$("#birthday_inf_" + cntI).val(convertDate(value.ngaysinh));
						cntI++;
						request.hanhkhach[ind].check = false;
					}
				});

				setTimeout(() => {
					const req = new RequestDecorator(request).withStopFollowAction().build(); // Gửi request về background
					chrome.runtime.sendMessage(req, () => request.auto_booking && $("#ctl10_btnConfirm")[0].click()); // Click tiếp tục
				}, 4000);
			}, 1000);
		}
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
