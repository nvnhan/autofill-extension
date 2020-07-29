const Config = {
	state: {
		// follow engine state
		waiting: {
			title: "Đang đợi",
			value: "waiting",
		},

		filling: {
			title: "Đang điền thông tin",
			value: "filling",
		},

		confirm: {
			title: "Xác nhận kết quả đặt chỗ",
			value: "confirm",
		},

		idle: {
			title: "Chưa bắt đầu",
			value: "idle",
		},

		error: {
			title: "Có lỗi xảy ra",
			value: "error",
		},

		filled: {
			title: "Đã điền thông tin",
			value: "filled",
		},

		redirected: {
			title: "Đã sang Payments",
			value: "redirected",
		},

		dangerous_goods: {
			title: "Đã xác nhận hàng hóa nguy hiểm",
			value: "dangerous_goods",
		},

		confirmed_order: {
			title: "Xác nhận đặt chỗ",
			value: "confirmed_order",
		},

		done: {
			title: "Xong",
			value: "done",
		},
	},

	time_wait_to_book_in_milliseconds: 3000,

	host: {
		api: "https://tienve.net/api/",
	},
};
