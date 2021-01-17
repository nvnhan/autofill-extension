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
		if (request.auto_booking) chrome.runtime.sendMessage(request, () => setTimeout(() => $("#tblBackCont a")[1].click(), 1000));
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
/**
 * Muadi.com.vn
 */
const muadi = () => {
	const start = () => {
		const request = pageState.getState().request;
		const req = new RequestDecorator(request).withFillingAction().build(); // Gửi request về background
		chrome.runtime.sendMessage(req, (response) => $("#ListBooking_btnSubmit")[0].click()); // Click tiếp tục để đến trang fill
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
				$("#ctl10_txtCustomerPhone").val(request.sdt);
				$("#ctl10_txtCustomerEmail").val(request.email);

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

const onlineAirTicket = () => {
	let isJetstarTickets = (tdElm) => {
		let concattedText = $(tdElm).find("a").text();
		return /jetstar/gi.test(concattedText);
	};

	/***
	 * return Item Object
	 * @param rowElm
	 */
	let parseItem = (rowElm) => {
		if ($(rowElm).find("td").length > 0) {
			let tdPriceTable = $(rowElm).find("td")[6];
			let planeCd = $($(rowElm).find("td")[1])
				.text()
				.replace(/^[A-z]+/, "");
			if (!isJetstarTickets(tdPriceTable)) {
				let aElms = $(tdPriceTable).find("a");

				let priceTable = [];
				aElms.each((index, elm) => {
					let seat_remaining = parseFloat(
						$(elm)
							.text()
							.replace(/[A-z]+/, "")
					);
					let strInfo = $(elm)
						.attr("onclick")
						.replace(/FillToBooking\('|'\)/gi, "");
					let arrInfo = strInfo.split(";");
					let price_base = parseFloat(arrInfo[6].replace(/,/g, ""));
					if (price_base)
						priceTable.push({
							seat_type: arrInfo[5].replace(/^[A-z]+/, ""),
							price_base: price_base,
							seat_remaining: seat_remaining,
							$a: $(elm),
						});
				});

				return {
					plane_cd: planeCd,
					price_table: priceTable,
				};
			}
		}

		return null;
	};

	/***
	 * return valid item
	 * @param items result search items
	 */
	let find = (items) => {
		let request = pageState.getState().request;
		let result = null;
		// Với từng chuyến bay
		for (let iRow = 0; iRow < items.length; iRow++) {
			let item = items[iRow];
			if (!item.price_table) continue;
			// Với từng chỗ ngồi
			// Từ giá thấp đến cao
			for (let iOption = item.price_table.length - 1; iOption >= 0; iOption--) {
				let option = item.price_table[iOption];
				if (option.price_base <= request.max_cost && option.seat_remaining > 0 && isValidPlaneCd(request.plane_cd, item.plane_cd)) {
					result = {
						plane_cd: item.plane_cd,
						option: option,
						airline_type: "vn",
						$a: option.$a,
					};
					break;
				}

				if (result) break;
			}
		}

		return result;
	};

	let isRunning = false;
	let tryAgainAction = null;

	let tryAgain = () => {
		console.log("tryagain");
		let request = Object.assign(getRequestData(), { action: "try-again" });
		chrome.runtime.sendMessage(request, () => {
			$("#btnSearhOneWay").click();
		});
	};

	let doReload = () => {
		console.log("reloading", isRunning);
		if (isRunning) {
			tryAgainAction = setTimeout(tryAgain, pageState.getState().request.time_refresh_in_seconds * 1000);
		}
	};

	let stopFollow = () => {
		isRunning = false;
		if (tryAgainAction) clearTimeout(tryAgainAction);
	};

	let getRequestData = function () {
		return pageState.getState.bind(pageState)()["request"];
	};

	let notifyFound = (foundItem) => {
		foundItem.from = $("#SearchOneWayDepartureCity").val();
		foundItem.to = $("#SearchOneWayArrivalCity").val();
		foundItem.date = $("#SearchOneWayDepartureDate").val();
		let request = new RequestDecorator(getRequestData()).withFoundAction().withAcceptedFlight(foundItem).build();
		chrome.runtime.sendMessage(request, (response) => {});
	};

	let startFollow = () => {
		let parsedItems = [];
		isRunning = true;
		console.log("start follow");

		// Duyệt tất cả các hàng
		if ($(".TblGrid tr").length > 0) {
			$(".TblGrid tr").each((index, elm) => {
				if (index !== 0) {
					// Kiểm tra lấy dữ liệu từ các hàng
					let parsedItem = parseItem(elm);
					if (parsedItem) parsedItems.push(parsedItem);
				}
			});
			console.log("Cac Chuyen bay parsed", parsedItems);
			// Tìm chuyền bay thỏa mãn
			let result = find(parsedItems);
			if (result) {
				console.log("found", result);

				//Neu không tự động đặt, cứ báo thành tìm thấy kết quả
				if (!pageState.getState().request.auto_booking) {
					notifyFound(result);
				}
				// Click ghế đã đc chọn
				result.$a[0].click();
				/////
				console.log("start auto fill", pageState.getState().request);
				$("#BookPhone").val(pageState.getState().request.sdt);
				$("#BookEmail").val(pageState.getState().request.email);
				//fill seat remaining
				let expected = pageState.getState().request.hanhkhach.length;
				let actual = result.option.seat_remaining;
				let cnt = 0;
				for (var i = 1; i <= expected; i++) {
					if (pageState.getState().request.hanhkhach[i - 1].check) {
						cnt++;
						$("#BookPassenger" + cnt).show();
						$("#BookPassenger" + cnt + "FullName").val(pageState.getState().request.hanhkhach[i - 1].hoten);
						$("#BookPassenger" + cnt + "Title").val(pageState.getState().request.hanhkhach[i - 1].gioitinh);
						if (
							pageState.getState().request.hanhkhach[i - 1].gioitinh == "MISS" ||
							pageState.getState().request.hanhkhach[i - 1].gioitinh == "MSTR"
						) {
							$("#BookPassenger" + cnt + "Birthday").show();
							var ns = new Date(pageState.getState().request.hanhkhach[i - 1].ngaysinh);
							$("#BookPassenger" + cnt + "Birthday").val(ns.getDate() + "/" + (ns.getMonth() + 1) + "/" + ns.getFullYear());
						}
						//////////////
						// Đánh dấu những hành khách đã được đặt chỗ
						////////////////
						pageState.getState().request.booked.push(i - 1);
						if (cnt >= actual)
							// Nếu hết chỗ rồi thì thôi
							break;
					}
				}
				// Điền danh sách hành khách
				$("#BookNumofPassenger>option:nth-of-type(" + cnt + ")").prop("selected", true);
				let ac = pageState.getState().request.action;
				// set booked
				pageState.getState().request.action = "set-state";
				chrome.runtime.sendMessage(pageState.getState().request, (response) => {});
				pageState.getState().request.action = ac;

				// Tự động đặt chỗ
				if (pageState.getState().request.auto_booking) {
					//Gửi yêu cầu xác thực đặt chỗ thành công hay không (vì chuyển page mới xác nhận đc nên cần hay đổi state)
					const request = new RequestDecorator(getRequestData()).withAcceptedFlight(result).withConfirmAction().build();
					chrome.runtime.sendMessage(request, (response) => {});
					//Click đặt chỗ
					$("#btnBookEnable").click();
				}
			} else {
				// Nếu không có ghế nào thỏa mãn
				doReload();
			}
		} else {
			// Nếu ko có chuyến bay nào
			doReload();
		}
	};

	let confirmBooking = () => {
		let isSuccess = !!$('#ShowBookMessage font[color="blue"]').length;
		let isFail = !!$('#ShowBookMessage font[color="red"]').length;
		console.log("s-f", isSuccess, isFail);
		if (isFail) {
			isRunning = true;
			const request = new RequestDecorator(getRequestData()).withTryAgainAction().build();
			chrome.runtime.sendMessage(request, (response) => {});
			doReload();
		} else if (isSuccess) {
			console.log("notify result", pageState.getState().result);
			notifyFound(pageState.getState().result);

			////////////////
			///////////////////////////////
			console.log("Booked index", pageState.getState().request.booked);
			pageState.getState().request.booked.forEach((item) => {
				console.log("uncheck item ", item);
				pageState.getState().request.hanhkhach[item].check = false;
			});
			pageState.getState().request.booked = [];
			let ac = pageState.getState().request.action;
			// set booked
			pageState.getState().request.action = "set-state";
			chrome.runtime.sendMessage(pageState.getState().request, (response) => {});
			pageState.getState().request.action = ac;
			////////////////////////////
			// Kiểm tra xem danh sách còn ko
			let doit = false;
			pageState
				.getState()
				.request.hanhkhach.filter(checkCheck)
				.forEach((hk) => {
					if (hk.check) {
						doit = true;
					}
				});
			// Re load lại trang
			if (doit) {
				isRunning = true;
				const request = new RequestDecorator(getRequestData()).withStartFollowAction().build();
				console.log("request send after booking", request);
				chrome.runtime.sendMessage(request, (response) => {});
				doReload();
			} else {
				let request = Object.assign(getRequestData(), { action: "stop-follow" });
				chrome.runtime.sendMessage(request, () => {});
				stopFollow();
			}
		}
	};

	// Chạy trước khi document ready
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		console.log("request", request);
		switch (request.state.request.action) {
			case "start-follow":
				pageState.setState(request.state);
				console.log("start follow onlineairticket", pageState.getState());
				startFollow();
				return sendResponse();
			case "stop-follow":
				pageState.setState(request.state);
				stopFollow();
				return sendResponse();
		}
	});

	loadCurrentStateTab((state) => {
		console.log("load current state tab");
		switch (state.result.follow_state) {
			case "idle":
				break;
			case "error":
				break;
			case "confirm":
				console.log("confirming");
				confirmBooking();
				break;
			case "refresh":
				startFollow();
				break;
			default:
		}

		// when document ready
		$(document).ready(() => {});
	});
};
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
				if ((cnt < cntA && checkAdult(value)) || (cnt < cntC && checkChild(value)) || (cnt < cntI && checkInfant(value))) {
					$(`#InfoPassener_Passengers_${cnt}__Gender`).val(checkInfant(value) ? value.gioitinh.substring(1) : value.gioitinh);
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
				$("#prefixPassengerItemAdt1BasicInfoEditNamePrefixPrefix-passenger-item-ADT-1-basic-info-edit-name-prefix").val(value.gioitinh);
				$("#lastNamePassengerItemAdt1BasicInfoEditNameLastName-passenger-item-ADT-1-basic-info-edit-name").val(value.hoten.split(" ")[0]);
				$("#firstNamePassengerItemAdt1BasicInfoEditNameFirstName-passenger-item-ADT-1-basic-info-edit-name").val(
					value.hoten.split(" ").slice(1).join(" ")
				);
				$("#dayPassengerItemAdt1BasicInfoEditDobDayDay-passenger-item-ADT-1-basic-info-edit-dob-day").val(d);
				$("#monthPassengerItemAdt1BasicInfoEditDobMonthMonth-passenger-item-ADT-1-basic-info-edit-dob-month").val(m);
				$("#yearPassengerItemAdt1BasicInfoEditDobYearYear-passenger-item-ADT-1-basic-info-edit-dob-year").val(y);
				cntA++;
				request.hanhkhach[ind].check = false;
			} else if (checkChild(value)) {
				$("#prefixPassengerItemChd1BasicInfoEditNamePrefixPrefix-passenger-item-CHD-1-basic-info-edit-name-prefix").val(value.gioitinh);
				$("#lastNamePassengerItemChd1BasicInfoEditNameLastName-passenger-item-CHD-1-basic-info-edit-name").val(value.hoten.split(" ")[0]);
				$("#firstNamePassengerItemChd1BasicInfoEditNameFirstName-passenger-item-CHD-1-basic-info-edit-name").val(
					value.hoten.split(" ").slice(1).join(" ")
				);
				$("#dayPassengerItemChd1BasicInfoEditDobDayDay-passenger-item-CHD-1-basic-info-edit-dob-day").val(d);
				$("#monthPassengerItemChd1BasicInfoEditDobMonthMonth-passenger-item-CHD-1-basic-info-edit-dob-month").val(m);
				$("#yearPassengerItemChd1BasicInfoEditDobYearYear-passenger-item-CHD-1-basic-info-edit-dob-year").val(y);
				cntC++;
				request.hanhkhach[ind].check = false;
			} else if (checkInfant(value)) {
				$("#prefixPassengerItemInf1BasicInfoEditNamePrefixPrefix-passenger-item-INF-1-basic-info-edit-name-prefix").val(
					value.gioitinh.substring(1)
				);
				$("#lastNamePassengerItemInf1BasicInfoEditNameLastName-passenger-item-INF-1-basic-info-edit-name").val(value.hoten.split(" ")[0]);
				$("#firstNamePassengerItemInf1BasicInfoEditNameFirstName-passenger-item-INF-1-basic-info-edit-name").val(
					value.hoten.split(" ").slice(1).join(" ")
				);
				$("#dayPassengerItemInf1BasicInfoEditDobDayDay-passenger-item-INF-1-basic-info-edit-dob-day").val(d);
				$("#monthPassengerItemInf1BasicInfoEditDobMonthMonth-passenger-item-INF-1-basic-info-edit-dob-month").val(m);
				$("#yearPassengerItemInf1BasicInfoEditDobYearYear-passenger-item-INF-1-basic-info-edit-dob-year").val(y);
				cntI++;
				request.hanhkhach[ind].check = false;
			}
		});

		setTimeout(() => {
			const req = new RequestDecorator(request).withStopFollowAction().build(); // Gửi request về background
			chrome.runtime.sendMessage(req, () => request.auto_booking && $("#dxp-page-navigation-continue-button")[0].click()); // Click tiếp tục
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
