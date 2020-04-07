import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { colors, fontStyles, baseStyles } from '../../../../styles/common';
import { strings } from '../../../../../locales/i18n';
import { getNetworkTypeById, findBlockExplorerForRpc, getBlockExplorerName } from '../../../../util/networks';
import { getEtherscanTransactionUrl, getEtherscanBaseUrl } from '../../../../util/etherscan';
import Logger from '../../../../util/Logger';
import { connect } from 'react-redux';
import URL from 'url-parse';
import EthereumAddress from '../../EthereumAddress';
import TransactionSummary from '../../../Views/TransactionSummary';
import { toDateFormat } from '../../../../util/date';

const styles = StyleSheet.create({
	detailRowWrapper: {
		paddingHorizontal: 15
	},
	detailRowTitle: {
		fontSize: 10,
		color: colors.grey500,
		marginBottom: 8,
		...fontStyles.normal
	},
	flexRow: {
		flexDirection: 'row'
	},
	section: {
		paddingVertical: 16
	},
	sectionBorderBottom: {
		borderBottomColor: colors.grey100,
		borderBottomWidth: 1
	},
	flexEnd: {
		flex: 1,
		alignItems: 'flex-end'
	},
	textUppercase: {
		textTransform: 'uppercase'
	},
	detailRowText: {
		fontSize: 12,
		color: colors.fontPrimary,
		...fontStyles.normal
	},
	viewOnEtherscan: {
		fontSize: 16,
		color: colors.blue,
		...fontStyles.normal,
		textAlign: 'center'
	},
	touchableViewOnEtherscan: {
		marginVertical: 24
	},
	summaryWrapper: {
		marginVertical: 6
	},
	statusText: {
		fontSize: 12,
		...fontStyles.normal
	}
});

const NO_RPC_BLOCK_EXPLORER = 'NO_BLOCK_EXPLORER';

/**
 * View that renders a transaction details as part of transactions list
 */
class TransactionDetails extends PureComponent {
	static propTypes = {
		/**
		/* navigation object required to push new views
		*/
		navigation: PropTypes.object,
		/**
		 * Object representing the selected the selected network
		 */
		network: PropTypes.object,
		/**
		 * Object corresponding to a transaction, containing transaction object, networkId and transaction hash string
		 */
		transactionObject: PropTypes.object,
		/**
		 * Object with information to render
		 */
		transactionDetails: PropTypes.object,
		/**
		 * Frequent RPC list from PreferencesController
		 */
		frequentRpcList: PropTypes.array,
		close: PropTypes.func
	};

	state = {
		rpcBlockExplorer: undefined
	};

	componentDidMount = () => {
		const {
			network: {
				provider: { rpcTarget, type }
			},
			frequentRpcList
		} = this.props;
		let blockExplorer;
		if (type === 'rpc') {
			blockExplorer = findBlockExplorerForRpc(rpcTarget, frequentRpcList) || NO_RPC_BLOCK_EXPLORER;
		}
		this.setState({ rpcBlockExplorer: blockExplorer });
	};

	viewOnEtherscan = () => {
		const {
			transactionObject: { networkID },
			transactionDetails: { transactionHash },
			network: {
				provider: { type }
			},
			close
		} = this.props;
		const { rpcBlockExplorer } = this.state;
		try {
			if (type === 'rpc') {
				const url = `${rpcBlockExplorer}/tx/${transactionHash}`;
				const title = new URL(rpcBlockExplorer).hostname;
				this.props.navigation.push('Webview', {
					url,
					title
				});
			} else {
				const network = getNetworkTypeById(networkID);
				const url = getEtherscanTransactionUrl(network, transactionHash);
				const etherscan_url = getEtherscanBaseUrl(network).replace('https://', '');
				this.props.navigation.push('Webview', {
					url,
					title: etherscan_url
				});
			}
			close && close();
		} catch (e) {
			// eslint-disable-next-line no-console
			Logger.error(e, { message: `can't get a block explorer link for network `, networkID });
		}
	};

	renderStatusText = status => {
		status = status.charAt(0).toUpperCase() + status.slice(1);
		switch (status) {
			case 'Confirmed':
				return <Text style={[styles.statusText, { color: colors.green400 }]}>{status}</Text>;
			case 'Pending':
			case 'Submitted':
				return <Text style={[styles.statusText, { color: colors.orange }]}>{status}</Text>;
			case 'Failed':
				return <Text style={[styles.statusText, { color: colors.red }]}>{status}</Text>;
		}
	};

	render = () => {
		const {
			transactionObject,
			transactionObject: { status, time }
		} = this.props;
		const { rpcBlockExplorer } = this.state;
		return (
			<View style={styles.detailRowWrapper}>
				<View style={[styles.section, styles.flexRow, styles.sectionBorderBottom]}>
					<View style={[baseStyles.flexGrow, styles.flexRow]}>
						<View style={baseStyles.flexRow}>
							<Text style={styles.detailRowTitle}>{'Status'}</Text>
							{this.renderStatusText(status)}
						</View>
						<View style={styles.flexEnd}>
							<Text style={styles.detailRowTitle}>{'Date'}</Text>
							<Text style={styles.statusText}>{toDateFormat(time)}</Text>
						</View>
					</View>
				</View>
				<View style={[styles.section, styles.flexRow, styles.sectionBorderBottom]}>
					<View style={[baseStyles.flexGrow, styles.flexRow]}>
						<View style={baseStyles.flexRow}>
							<Text style={styles.detailRowTitle}>{strings('transactions.from')}</Text>
							<EthereumAddress
								type="medium"
								style={styles.detailRowText}
								address={this.props.transactionDetails.renderFrom}
							/>
						</View>
						<View style={styles.flexEnd}>
							<Text style={styles.detailRowTitle}>{strings('transactions.to')}</Text>
							<EthereumAddress
								type="medium"
								style={styles.detailRowText}
								address={this.props.transactionDetails.renderTo}
							/>
						</View>
					</View>
				</View>
				<View style={styles.section}>
					<Text style={[styles.detailRowTitle, styles.textUppercase]}>{'Nonce'}</Text>
					<Text style={[styles.detailRowText]}>
						{`#${parseInt(transactionObject.transaction.nonce.replace(/^#/, ''), 16)}`}
					</Text>
				</View>
				<View style={styles.summaryWrapper}>
					<TransactionSummary
						amount={this.props.transactionDetails.renderValueFiat}
						fee={this.props.transactionDetails.renderTotalGasFiat}
						totalAmount={this.props.transactionDetails.renderTotalValueFiat}
						secondaryTotalAmount={this.props.transactionDetails.renderTotalValue}
						gasEstimationReady
					/>
				</View>

				{this.props.transactionDetails.transactionHash &&
					transactionObject.status !== 'cancelled' &&
					rpcBlockExplorer !== NO_RPC_BLOCK_EXPLORER && (
						<TouchableOpacity onPress={this.viewOnEtherscan} style={styles.touchableViewOnEtherscan}>
							<Text style={styles.viewOnEtherscan}>
								{(rpcBlockExplorer &&
									`${strings('transactions.view_on')} ${getBlockExplorerName(rpcBlockExplorer)}`) ||
									strings('transactions.view_on_etherscan')}
							</Text>
						</TouchableOpacity>
					)}
			</View>
		);
	};
}

const mapStateToProps = state => ({
	network: state.engine.backgroundState.NetworkController,
	frequentRpcList: state.engine.backgroundState.PreferencesController.frequentRpcList
});
export default connect(mapStateToProps)(TransactionDetails);
