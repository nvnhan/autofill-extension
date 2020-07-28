class PageState {
	constructor() {
		this.state = null;
		this.stateChangeListeners = [];
		this.followStateChangeListeners = [];
	}

	getState() {
		return this.state;
	}

	setState(state) {
		this.state = state;

		this.stateChangeListeners.forEach((listener) => {
			listener(this.state);
		});

		return this;
	}

	setFollowState(followState) {
		if (this.state) this.state.result.follow_state = followState;

		this.followStateChangeListeners.forEach((listener) => {
			listener(followState);
		});

		return this;
	}

	onFollowStateChange(listener) {
		if (listener) this.followStateChangeListeners.push(listener);
		return this;
	}

	onStateChange(listener) {
		if (listener) this.stateChangeListeners.push(listener);
		return this;
	}
}

class RequestDecorator {
	constructor(request) {
		this.request = request;
	}

	withTab(tab) {
		this.request = Object.assign({}, this.request, { tab: tab });
		return this;
	}

	withStartFollowAction() {
		this.request = Object.assign({}, this.request, { action: "start-fill" });
		return this;
	}

	withStopFollowAction() {
		this.request = Object.assign({}, this.request, { action: "stop-fill" });
		return this;
	}

	withGotResultAction() {
		this.request = Object.assign({}, this.request, { action: "got-result" });
		return this;
	}

	withTryAgainAction() {
		this.request = Object.assign({}, this.request, { action: "try-again" });
		return this;
	}

	withReloadAction() {
		this.request = Object.assign({}, this.request, { action: "reload" });
		return this;
	}

	withAcceptedFlight(acceptedFlight) {
		this.request = Object.assign({}, this.request, { acceptedFlight: acceptedFlight });
		return this;
	}

	withConfirmAction() {
		this.request = Object.assign({}, this.request, { action: "confirm" });
		return this;
	}

	withFilledAction() {
		this.request = Object.assign({}, this.request, { action: "filled" });
		return this;
	}

	withRedirectedAction() {
		this.request = Object.assign({}, this.request, { action: "redirected" });
		return this;
	}

	withManualRedirectAction() {
		this.request = Object.assign({}, this.request, { action: "manual_redirected" });
		return this;
	}

	withConfirmDangerousGoodsAction() {
		this.request = Object.assign({}, this.request, { action: "dangerous_goods" });
		return this;
	}

	withConfirmedOrderAction() {
		this.request = Object.assign({}, this.request, { action: "confirmed_order" });
		return this;
	}

	withDoneAction() {
		this.request = Object.assign({}, this.request, { action: "done" });
		return this;
	}

	build() {
		return this.request;
	}
}

isValidPlaneCd = (expected, actual) => {
	return !expected || expected == "" || expected.split(",").indexOf(actual) != -1;
};
