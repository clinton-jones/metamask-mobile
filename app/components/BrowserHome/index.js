import React, { Component } from 'react';
import PropTypes from 'prop-types';
import getNavbarOptions from '../Navbar';
import HomePage from '../HomePage';
import onUrlSubmit from '../../util/browser';
import Feedback from '../../core/Feedback';
import AppConstants from '../../core/AppConstants';
import DeeplinkManager from '../../core/DeeplinkManager';
import Branch from 'react-native-branch';
import Logger from '../../util/Logger';

/**
 * Complete Web browser component with URL entry and history management
 */
export default class BrowserHome extends Component {
	static navigationOptions = ({ navigation }) => getNavbarOptions('ÐApp Browser', navigation);

	static defaultProps = {
		defaultProtocol: 'https://'
	};

	static propTypes = {
		/**
		 * Protocol string to append to URLs that have none
		 */
		defaultProtocol: PropTypes.string,
		/**
		 * Initial URL to load in the WebView
		 */
		defaultURL: PropTypes.string,
		/**
		 * react-navigation object used to switch between screens
		 */
		navigation: PropTypes.object
	};

	state = {
		url: this.props.defaultURL || '',
		tabs: []
	};

	async componentDidMount() {
		Branch.subscribe(this.handleDeeplinks);
		this.feedback = new Feedback({
			action: () => {
				this.props.navigation.push('BrowserView', { url: AppConstants.FEEDBACK_URL });
			}
		});
	}

	componentWillUnmount() {
		this.feedback.stopListening();
	}

	handleDeeplinks = async ({ error, params }) => {
		if (error) {
			Logger.error('Error from Branch: ', error);
			return;
		}
		if (params['+non_branch_link']) {
			const dm = new DeeplinkManager(this.props.navigation);
			dm.parse(params['+non_branch_link']);
		}
	};

	go = async url => {
		this.setState({ tabs: [...this.state.tabs, url] });
		this.props.navigation.navigate('BrowserView', { url });
	};

	onInitialUrlSubmit = async url => {
		if (url === '') {
			return false;
		}
		const { defaultProtocol } = this.props;
		const sanitizedInput = onUrlSubmit(url, defaultProtocol);
		await this.go(sanitizedInput);
	};

	render = () => <HomePage onBookmarkTapped={this.go} onInitialUrlSubmit={this.onInitialUrlSubmit} />;
}