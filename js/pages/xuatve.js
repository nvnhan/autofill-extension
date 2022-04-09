/**
 * Xuatve.vn
 */
const xuatve = () => {
	const start = () => {
		const request = pageState.getState().request;
		const req = new RequestDecorator(request).withFillingAction().build(); // Gửi request về background
		// Bỏ sự kiện click mặc định của web
		chrome.runtime.sendMessage(req, () => $("#ContentPlaceHolder1_btnContinue").unbind("click").click()); // Click tiếp tục để đến trang fill
	};

	const fill = () => {
		const request = pageState.getState().request;
		$("#ContentPlaceHolder1_txtFirstName").val(request.tenkhachhang.split(" ")[0]);
		$("#ContentPlaceHolder1_txtLastName").val(request.tenkhachhang.split(" ").slice(1).join(" "));
		$("#ContentPlaceHolder1_txtPhone").val(request.sdt);
		$("#ContentPlaceHolder1_txtEmail").val(request.email);

		let cntA = 0;
		let cntC = 0;
		let cntI = 0;
		request.hanhkhach.forEach((value, ind) => {
			if (!value.check) return;
			if (checkAdult(value) && $("#ContentPlaceHolder1_rptADT_ddlGender_" + cntA).length > 0) {
				$("#ContentPlaceHolder1_rptADT_ddlGender_" + cntA).val(value.gioitinh === "MR" ? 0 : 1);
				$("#ContentPlaceHolder1_rptADT_txtHo_" + cntA).val(value.hoten.split(" ")[0]);
				$("#ContentPlaceHolder1_rptADT_txtDemTen_" + cntA).val(value.hoten.split(" ").slice(1).join(" "));
				cntA++;
				request.hanhkhach[ind].check = false;
			} else if (checkChild(value) && $("#ContentPlaceHolder1_rptCHD_ddlGender_" + cntC).length > 0) {
				$("#ContentPlaceHolder1_rptCHD_ddlGender_" + cntC).val(value.gioitinh === "MSTR" ? 0 : 1);
				$("#ContentPlaceHolder1_rptCHD_txtHo_" + cntC).val(value.hoten.split(" ")[0]);
				$("#ContentPlaceHolder1_rptCHD_txtDemTen_" + cntC).val(value.hoten.split(" ").slice(1).join(" "));
				$("#ContentPlaceHolder1_rptCHD_txtBD_" + cntC).val(convertDate(value.ngaysinh));
				cntC++;
				request.hanhkhach[ind].check = false;
			} else if (checkInfant(value) && $("#ContentPlaceHolder1_rptINF_ddlGender_" + cntI).length > 0) {
				$("#ContentPlaceHolder1_rptINF_ddlGender_" + cntI).val(value.gioitinh === "eMSTR" ? 0 : 1);
				$("#ContentPlaceHolder1_rptINF_txtHo_" + cntI).val(value.hoten.split(" ")[0]);
				$("#ContentPlaceHolder1_rptINF_txtDemTen_" + cntI).val(value.hoten.split(" ").slice(1).join(" "));
				$("#ContentPlaceHolder1_rptINF_txtBD_" + cntI).val(convertDate(value.ngaysinh));
				cntI++;
				request.hanhkhach[ind].check = false;
			}
		});

		setTimeout(() => {
			const req = new RequestDecorator(request).withStopFollowAction().build(); // Gửi request về background
			chrome.runtime.sendMessage(req, () => request.auto_booking && $("#btnContinue")[0].click()); // Click tiếp tục
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
