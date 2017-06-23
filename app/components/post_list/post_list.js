// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    View
} from 'react-native';
import FlatList from 'app/components/inverted_flat_list';

import {General} from 'mattermost-redux/constants';
import {addDatesToPostList} from 'mattermost-redux/utils/post_utils';

import ChannelIntro from 'app/components/channel_intro';
import Post from 'app/components/post';
import DateHeader from './date_header';
import LoadMorePosts from './load_more_posts';
import NewMessagesDivider from './new_messages_divider';

const LOAD_MORE_POSTS = 'load-more-posts';

export default class PostList extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            refreshChannel: PropTypes.func.isRequired
        }).isRequired,
        channel: PropTypes.object,
        channelIsLoading: PropTypes.bool.isRequired,
        currentUserId: PropTypes.string,
        indicateNewMessages: PropTypes.bool,
        isLoadingMore: PropTypes.bool,
        lastViewedAt: PropTypes.number,
        loadMore: PropTypes.func,
        navigator: PropTypes.object,
        onPostPress: PropTypes.func,
        posts: PropTypes.array.isRequired,
        refreshing: PropTypes.bool,
        renderReplies: PropTypes.bool,
        showLoadMore: PropTypes.bool,
        theme: PropTypes.object.isRequired
    };

    static defaultProps = {
        channel: {}
    };

    getPostsWithDates = () => {
        const {posts, indicateNewMessages, currentUserId, lastViewedAt, showLoadMore} = this.props;
        const list = addDatesToPostList(posts, {indicateNewMessages, currentUserId, lastViewedAt});

        if (showLoadMore) {
            return [...list, LOAD_MORE_POSTS];
        }

        return list;
    };

    keyExtractor = (item) => {
        if (item instanceof Date) {
            return item.getTime();
        }
        if (item === General.START_OF_NEW_MESSAGES || item === LOAD_MORE_POSTS) {
            return item;
        }

        return item.id;
    };

    loadMorePosts = () => {
        const {loadMore, isLoadingMore} = this.props;
        if (typeof loadMore === 'function' && !isLoadingMore) {
            loadMore();
        }
    };

    onRefresh = () => {
        const {actions, channel} = this.props;

        if (Object.keys(channel).length) {
            actions.refreshChannel(channel.id);
        }
    };

    renderChannelIntro = () => {
        const {channel, channelIsLoading, navigator, posts} = this.props;

        // Check the webapp for atEnd, and replace it here
        if (channel.hasOwnProperty('id')) {
            const firstPostHasRendered = channel.total_msg_count ? posts.length > 0 : true;
            const messageCount = channel.total_msg_count - posts.length;
            if (channelIsLoading || !firstPostHasRendered || messageCount > 0) {
                return null;
            }

            return (
                <View>
                    <ChannelIntro navigator={navigator}/>
                </View>
            );
        }

        return null;
    };

    renderDateHeader = (date) => {
        return (
            <DateHeader
                theme={this.props.theme}
                date={date}
            />
        );
    };

    renderItem = ({item}) => {
        if (item instanceof Date) {
            return this.renderDateHeader(item);
        }
        if (item === General.START_OF_NEW_MESSAGES) {
            return (
                <NewMessagesDivider
                    theme={this.props.theme}
                />
            );
        }
        if (item === LOAD_MORE_POSTS) {
            return (
                <LoadMorePosts
                    loading={this.props.isLoadingMore}
                    theme={this.props.theme}
                />
            );
        }

        return this.renderPost(item);
    };

    renderPost = (post) => {
        return (
            <Post
                post={post}
                renderReplies={this.props.renderReplies}
                isFirstReply={post.isFirstReply}
                isLastReply={post.isLastReply}
                commentedOnPost={post.commentedOnPost}
                onPress={this.props.onPostPress}
                navigator={this.props.navigator}
            />
        );
    };

    render() {
        const {channel, refreshing, theme} = this.props;

        const refreshControl = {
            refreshing
        };

        if (Object.keys(channel).length) {
            refreshControl.onRefresh = this.onRefresh;
        }

        return (
            <FlatList
                data={this.getPostsWithDates()}
                initialNumToRender={20}
                inverted={true}
                keyExtractor={this.keyExtractor}
                ListFooterComponent={this.renderChannelIntro}
                onEndReached={this.loadMorePosts}
                onEndReachedThreshold={700}
                {...refreshControl}
                renderItem={this.renderItem}
                theme={theme}
            />
        );
    }
}
