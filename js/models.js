"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    return new URL(this.url).hostname;
    //return this.url; //should be just the hostname!!
  }

  /** Takes in a storyID and returns the story object associated with that ID */
  static async getStoryFromId(storyId){
    console.log("passed-in ID ", storyId);
    const response = await fetch(`${BASE_URL}/stories/${storyId}`);
    const storyResponse = await response.json();
    const story = new Story(storyResponse.story);
    return story;
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await fetch(`${BASE_URL}/stories`, {
      method: "GET",
    });
    const storiesData = await response.json();

    // turn plain old story objects from API into instances of Story class
    const stories = storiesData.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, newStory) {
    // UNIMPLEMENTED: complete this function!
    // const storyString = JSON.stringify(newStory);
    // console.log('addStory storyString', storyString);

    console.log('addStory user', user);
    const body = {
      token: user.loginToken,
      story: newStory
    };

    const storyResponse = await fetch(`${BASE_URL}/stories/`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" }
    });
    console.log('addStory storyResponse', storyResponse);

    const storyReturnObject = await storyResponse.json();
    console.log('storyReturnObject!?', storyReturnObject);
    const { story } = storyReturnObject;
    console.log('story!?', story);
    const storyToBeReturned = new Story(story);

    this.stories.unshift(storyToBeReturned);

    return storyToBeReturned;
  }
}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
    username,
    name,
    createdAt,
    favorites = [],
    ownStories = []
  },
    token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await fetch(`${BASE_URL}/signup`, {
      method: "POST",
      body: JSON.stringify({ user: { username, password, name } }),
      headers: {
        "content-type": "application/json",
      }
    });
    const userData = await response.json();
    const { user } = userData;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      userData.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      body: JSON.stringify({ user: { username, password } }),
      headers: {
        "content-type": "application/json",
      }
    });
    const userData = await response.json();
    const { user } = userData;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      userData.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const tokenParams = new URLSearchParams({ token });

      const response = await fetch(
        `${BASE_URL}/users/${username}?${tokenParams}`,
        {
          method: "GET"
        }
      );
      const userData = await response.json();
      const { user } = userData;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }


  //TODO: Update docstring w/ return value for add/removeFav
  /**for current user, make API call to add the passed-in story to that
   * user's array of favorites */
  async addFavorite(story) {
    const body = { token: this.loginToken };

    const response = await fetch(
      `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" }
    });

    //use the response from earlier get the user object from that, pass it
    // to a dedicated function which will refresh the currentuser state
    let responseJson = await response.json(); //TODO: try to rename w/o response or Json in variable name
    return responseJson;

  }

  /**for current user, make API call to remove the passed-in story from that
    * user's array of favorites */
  async removeFavorite(story) {
    const body = { token: this.loginToken };

    const response = await fetch(
      `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`, {
      method: "DELETE",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" }
    });


    let responseJson = await response.json();
    return responseJson;
  }
}


