"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  console.debug(getAndShowStoriesOnStart);
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  return $(`
      <li id="${story.storyId}">
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/**Generates and returns html text for favorite and remove favorite buttons */

function generateFavoriteButtons() {
  return $(`
  <button class = "favorite-button">Favorite</button>
  <button class = "remove-favorite-button">Remove Favorite</button>`);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    const $favButtons = generateFavoriteButtons();
    $story.append($favButtons);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}
/** Hide stories list and display only favorite stories */

function putFavStoriesOnPage(){
  $favStoriesList.empty();
  for (let story of currentUser.favorites) {
    const $story = generateStoryMarkup(story);
    const $favButtons = generateFavoriteButtons();
    $story.append($favButtons);
    $favStoriesList.append($story);
  }

}

$storiesContainer.on("click", ".favorite-button", handleFavoriteClick);

/** Makes a call to add favorite and update currentUser from API response*/
async function handleFavoriteClick(evt){
  //TODO: want to add hide button when appropriate
  const $clickTarget = $(evt.target);
  const $storyTarget = $clickTarget.closest("li");
  const storyId = $storyTarget.attr("id");
  const story = await Story.getStoryFromId(storyId);
  const userJson = await currentUser.addFavorite(story);
  refreshUser(userJson);
}

$storiesContainer.on("click", ".remove-favorite-button", handleRemoveFavoriteClick);

/** Makes a call to add favorite */
async function handleRemoveFavoriteClick(evt){
  //TODO: want to add hide button when appropriate
  const $clickTarget = $(evt.target);
  const $storyTarget = $clickTarget.closest("li");
  const storyId = $storyTarget.attr("id");
  const story = await Story.getStoryFromId(storyId);
  const userJson = await currentUser.removeFavorite(story);
  refreshUser(userJson);
}

$storySubmitForm.on('submit', handleStorySubmit);

/** get data from form input and put new story on page  */
async function handleStorySubmit(evt) {
  evt.preventDefault();
  // call when user submits form
  // get the data from the form
  const storyData = getStoryFormInputs();
  console.log('storySubmitForm storyData', storyData);

  // call the .addStory method we wrote earlier
  const newStory = await storyList.addStory(currentUser, storyData);

  // put that new story on the page
  putStoriesOnPage();
}

/**gets data from story form submit and return a story object in the form
 * {title, author, url}
 */
function getStoryFormInputs() {
  const title = $storySubmitFields.eq(0).val(); //TODO: avoid hardcoding the order
  const author = $storySubmitFields.eq(1).val();
  const url = $storySubmitFields.eq(2).val();

  return { title, author, url };
}