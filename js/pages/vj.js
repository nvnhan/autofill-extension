/**
 * Vietjetair
 */
const vj = () => {
	const start = () => {
		const request = pageState.getState().request;
		const req = new RequestDecorator(request).withFillingAction().build(); // Gửi request về background
		chrome.runtime.sendMessage(req, () => $("#contentwsb a.rightbutton")[0].click()); // Click tiếp tục để đến trang fill
	};

	const fill = function () {
		const request = pageState.getState().request;
		let phone1 = request.sdt,
			phone2 = request.sdt;

		if (/booking/gi.test(url)) {
			// Nếu ở trang web (ko phải đại lý) thì mới thêm
			$("#txtResContact_Name").val(request.tenkhachhang);
			$("#txtResContact_EMail").val(request.email);
		} else if (phone1.includes(",")) [phone1, phone2] = phone1.split(",");
		$("#txtResContact_Phone").val(phone1);

		$("#txtPax1_Addr1").val(request.diachi);
		$("#txtPax1_City").val(request.diachi);
		$("#txtPax1_Ctry").val(234); // 234 ~ VN
		$("#txtPax1_EMail").val(request.email);

		$($("span.mobileNumber")[0]).find("div.selected-flag")[0].click();
		$($("ul.country-list")[0]).find("li[data-dial-code=84]")[0].click();
		$("#txtPax1_Phone2").val(phone2);
		var evt = document.createEvent("KeyboardEvent");
		evt.initEvent("change", true, true);
		document.getElementById("txtPax1_Phone2").dispatchEvent(evt);

		let cnt = 1;
		let cntA = parseInt($("table#tblPaxCountsInfo td:nth-child(1)").text().trim().slice(-2));
		let cntC = cntA + parseInt($("table#tblPaxCountsInfo td:nth-child(2)").text().trim().slice(-2));
		let infant = parseInt($("table#tblPaxCountsInfo td:nth-child(3)").text().trim().slice(-2));
		let cntI = 1;
		request.hanhkhach.forEach((value, ind) => {
			if (!value.check) return;
			if (!checkInfant(value) && $(`#txtPax${cnt}_LName`).length > 0) {
				// Người lớn và trẻ em
				if ((cnt <= cntA && checkAdult(value)) || (cnt <= cntC && checkChild(value))) {
					if (checkAdult(value))
						if (value.gioitinh == "MR") $(`select#txtPax${cnt}_Gender`).val("M");
						else $(`select#txtPax${cnt}_Gender`).val("F");

					$(`#txtPax${cnt}_LName`).val(value.hoten.split(" ")[0]);
					$(`#txtPax${cnt}_FName`).val(value.hoten.split(" ").slice(1).join(" "));
					cnt++;
					request.hanhkhach[ind].check = false;
				}
			} else if (checkInfant(value) && cntI <= infant) {
				// Hết người lớn => EM BÉ
				$(`#chkPax${cntI}_Infant`)[0].click();
				$(`#txtPax${cntI}_Infant_FName`).val(value.hoten.split(" ")[0]);
				$(`#txtPax${cntI}_Infant_LName`).val(value.hoten.split(" ").slice(1).join(" "));

				let da = value.ngaysinh.split("-");
				const d = parseInt(da[2]);
				const m = parseInt(da[1]);
				const y = parseInt(da[0]);
				$(`#txtPax${cntI}_Infant_DOB_Day`).val(d < 10 ? "0" + d : d);
				$(`#txtPax${cntI}_Infant_DOB_Month`).val(m < 10 ? "0" + m : m);
				$(`#txtPax${cntI}_Infant_DOB_Year`).val(y);

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
				chrome.runtime.sendMessage(req, () => $("#contentwsb a.rightbutton")[0].click()); // Click tiếp tục
			}
		}, 4000);
	};

	const redirectToPayments = function () {
		const request = pageState.getState().request;

		let req = new RequestDecorator(request).withRedirectedAction().build();
		chrome.runtime.sendMessage(
			req,
			() =>
				(window.location.href = /booking/gi.test(url)
					? "https://booking.vietjetair.com/Payments.aspx?lang=vi&st=sl&sesid="
					: "https://agents.vietjetair.com/Payments.aspx?lang=vi&st=sl&sesid=")
		);
	};

	const tickDangerousGoods = function () {
		$("#dangerous_goods_check")[0].click();

		if ($('input[name="lstPmtType"]').filter("[value='63,PL6,0,V,0,0,0']").length) {
			$('input[name="lstPmtType"]').filter("[value='63,PL6,0,V,0,0,0']").click();

			let request = new RequestDecorator(pageState.getState().request).withConfirmDangerousGoodsAction().build();
			chrome.runtime.sendMessage(request, () => $("#contentwsb a.leftbutton")[0].click());
		} else {
			// neu ko co thanh toan sau thi dung lai
			let request = new RequestDecorator(pageState.getState().request).withStopFollowAction().build();
			chrome.runtime.sendMessage(request);
		}
	};

	const tickConfirmOrder = function () {
		$("#chkIAgree")[0].click();

		let request = new RequestDecorator(pageState.getState().request).withConfirmedOrderAction().build();
		if (request.auto_booking)
			chrome.runtime.sendMessage(request, () => setTimeout(() => $("#tblBackCont a")[1].click(), 1000));
		else {
			request = new RequestDecorator(pageState.getState().request).withStopFollowAction().build();
			chrome.runtime.sendMessage(request);
		}
	};

	const done = function () {
		if ($(".ResNumber").length) {
			var value = $(".ResNumber").html();
			alert(value);
			console.log("done cmnr");
			let request = new RequestDecorator(pageState.getState().request).withStopFollowAction().build();
			chrome.runtime.sendMessage(request, (response) => {});
		} else {
			console.log("Cho xac nhan");
		}
	};

	// Thêm listener => trigger from popup
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		switch (request.state.request.action) {
			case "start-fill":
				pageState.setState(request.state);
				start();
				return sendResponse();
		}
	});

	// Chạy 1 lần khi reload trang => Các bước tool tự hoạt động và load trang
	loadCurrentStateTab((state) => {
		switch (state.result.follow_state) {
			case "filling":
				fill();
				break;
			case "filled":
				redirectToPayments();
				break;
			case "redirected":
				console.log("dang o trang payment");
				tickDangerousGoods();
				break;
			case "dangerous_goods":
				console.log("dang trong trang confirm dat cho");
				tickConfirmOrder();
				break;
			case "confirmed_order":
				console.log("da confirmed order");
				done();
				break;
			default:
		}
	});
};
