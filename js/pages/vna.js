/**
 * Vietnamairline
 */
const vna = () => {
	const start = () => {
		const request = pageState.getState().request;
		const req = new RequestDecorator(request).withFillingAction().build(); // Gửi request về background
		// Bỏ sự kiện click mặc định của web
		chrome.runtime.sendMessage(req, () => {
			$("#dxp-page-navigation-continue-button").click(); // Click tiếp tục để đến trang fill
			// Single Page Application: ReactJS => wait for page loading
			setTimeout(fill, 10000);
		});
	};

	const fill = () => {
		const request = pageState.getState().request;
		// $("#ContentPlaceHolder1_txtFirstName").val(request.tenkhachhang.split(" ")[0]);
		// $("#ContentPlaceHolder1_txtLastName").val(request.tenkhachhang.split(" ").slice(1).join(" "));
		$("#phone0Input-0-required-passenger-item-ADT-1-0").val(request.sdt);
		$("#emailRequiredPassengerItemAdt1Email-required-passenger-item-ADT-1").val(request.email);

		let cntA = 0;
		let cntC = 0;
		let cntI = 0;
		request.hanhkhach.forEach((value, ind) => {
			if (!value.check) return;
			let da = value.ngaysinh.split("-");
			const d = parseInt(da[2]);
			const m = parseInt(da[1]);
			const y = parseInt(da[0]);
			if (checkAdult(value)) {
				$(
					"#prefixPassengerItemAdt1BasicInfoEditNamePrefixPrefix-passenger-item-ADT-1-basic-info-edit-name-prefix"
				).val(value.gioitinh);
				$("#lastNamePassengerItemAdt1BasicInfoEditNameLastName-passenger-item-ADT-1-basic-info-edit-name").val(
					value.hoten.split(" ")[0]
				);
				$(
					"#firstNamePassengerItemAdt1BasicInfoEditNameFirstName-passenger-item-ADT-1-basic-info-edit-name"
				).val(value.hoten.split(" ").slice(1).join(" "));
				$("#dayPassengerItemAdt1BasicInfoEditDobDayDay-passenger-item-ADT-1-basic-info-edit-dob-day").val(d);
				$(
					"#monthPassengerItemAdt1BasicInfoEditDobMonthMonth-passenger-item-ADT-1-basic-info-edit-dob-month"
				).val(m);
				$("#yearPassengerItemAdt1BasicInfoEditDobYearYear-passenger-item-ADT-1-basic-info-edit-dob-year").val(
					y
				);
				cntA++;
				request.hanhkhach[ind].check = false;
			} else if (checkChild(value)) {
				$(
					"#prefixPassengerItemChd1BasicInfoEditNamePrefixPrefix-passenger-item-CHD-1-basic-info-edit-name-prefix"
				).val(value.gioitinh);
				$("#lastNamePassengerItemChd1BasicInfoEditNameLastName-passenger-item-CHD-1-basic-info-edit-name").val(
					value.hoten.split(" ")[0]
				);
				$(
					"#firstNamePassengerItemChd1BasicInfoEditNameFirstName-passenger-item-CHD-1-basic-info-edit-name"
				).val(value.hoten.split(" ").slice(1).join(" "));
				$("#dayPassengerItemChd1BasicInfoEditDobDayDay-passenger-item-CHD-1-basic-info-edit-dob-day").val(d);
				$(
					"#monthPassengerItemChd1BasicInfoEditDobMonthMonth-passenger-item-CHD-1-basic-info-edit-dob-month"
				).val(m);
				$("#yearPassengerItemChd1BasicInfoEditDobYearYear-passenger-item-CHD-1-basic-info-edit-dob-year").val(
					y
				);
				cntC++;
				request.hanhkhach[ind].check = false;
			} else if (checkInfant(value)) {
				$(
					"#prefixPassengerItemInf1BasicInfoEditNamePrefixPrefix-passenger-item-INF-1-basic-info-edit-name-prefix"
				).val(value.gioitinh.substring(1));
				$("#lastNamePassengerItemInf1BasicInfoEditNameLastName-passenger-item-INF-1-basic-info-edit-name").val(
					value.hoten.split(" ")[0]
				);
				$(
					"#firstNamePassengerItemInf1BasicInfoEditNameFirstName-passenger-item-INF-1-basic-info-edit-name"
				).val(value.hoten.split(" ").slice(1).join(" "));
				$("#dayPassengerItemInf1BasicInfoEditDobDayDay-passenger-item-INF-1-basic-info-edit-dob-day").val(d);
				$(
					"#monthPassengerItemInf1BasicInfoEditDobMonthMonth-passenger-item-INF-1-basic-info-edit-dob-month"
				).val(m);
				$("#yearPassengerItemInf1BasicInfoEditDobYearYear-passenger-item-INF-1-basic-info-edit-dob-year").val(
					y
				);
				cntI++;
				request.hanhkhach[ind].check = false;
			}
		});

		setTimeout(() => {
			const req = new RequestDecorator(request).withStopFollowAction().build(); // Gửi request về background
			chrome.runtime.sendMessage(
				req,
				() => request.auto_booking && $("#dxp-page-navigation-continue-button")[0].click()
			); // Click tiếp tục
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

	// loadCurrentStateTab((state) => {
	// 	switch (state.result.follow_state) {
	// 		case "filling":
	// 			fill();
	// 			break;
	// 		default:
	// 	}
	// });
};
