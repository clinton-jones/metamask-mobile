export function hideTransactionNotification() {
	return {
		type: 'HIDE_TRANSACTION_NOTIFICATION'
	};
}

export function showTransactionNotification({ autodismiss, transactionId }) {
	console.log('showTransactionNotification', showTransactionNotification);
	return {
		type: 'SHOW_TRANSACTION_NOTIFICATION',
		isVisible: true,
		autodismiss,
		transactionId
	};
}