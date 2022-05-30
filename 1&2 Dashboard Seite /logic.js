const heiseNews = (() => {
  const weatherApi =
    "https://api.weatherapi.com/v1/forecast.json?key=56b3397b6a1c43c7ade90530222605&q=__LOCATION__&days=__DAYS__";
  const forecastDays = 3;
  const heiseApi = "https://www.heise.de/extras/frontend/news/";
  const allArticles = "?offset=__OFFSET__&limit=__LIMIT__";

  const getWeatherforecast = function (loc) {
    if (typeof loc !== "string") {
      loc = loc.coords.latitude + "," + loc.coords.longitude;
    }

    fetch(
      weatherApi.replace(/__LOCATION__/, loc).replace(/__DAYS__/, forecastDays),
    )
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        renderWeatherForecast({ weatherData: json });
      });
  };

  const getArticles = function ({ offset, limit }) {
    let api = heiseApi +
      allArticles.replace(/__OFFSET__/, Number(offset)).replace(
        /__LIMIT__/,
        Number(limit),
      );
    fetch(api, {
      headers: getHeaders(),
    }).then((response) => {
      return response.json();
    }).then((json) => {
      console.log(json);
      if (json.hasOwnProperty("errors")) {
        removeReloadButton({});
      } else {
        renderArticles({ articles: json, offset: offset, limit: limit });
      }
    });
  };

  const renderWeatherForecast = function ({ weatherData = {} }) {
    console.log(weatherData);
    const weatherForecast = document.querySelector("#weatherforecast");
    if (Object.keys(weatherData).length !== 0) {
      const img = weatherForecast.querySelector("#weather_img");
      const weatherConditionText =
        weatherData.forecast.forecastday[0].day.condition.text;
      weatherForecast.querySelector("#weather_location").innerText =
        weatherData.location.name;
      img.src = weatherData.forecast.forecastday[0].day.condition.icon;
      img.setAttribute("alt", weatherConditionText);
      img.setAttribute("title", "Heute");
      weatherForecast.querySelector("#weather_min-max").innerText =
        weatherData.forecast.forecastday[0].day.mintemp_c + "°C | " +
        weatherData.forecast.forecastday[0].day.maxtemp_c + "°C";
      const tomorrow = weatherForecast.querySelector(
        "#weatherforecast__tomorrow",
      );
      const tomorrowImg = tomorrow.querySelector('img');
      tomorrowImg.src = weatherData.forecast.forecastday[1].day.condition.icon;
      tomorrowImg.setAttribute('alt', weatherData.forecast.forecastday[1].day.condition.text);
      tomorrowImg.setAttribute('title', "Morgen");
      tomorrow.closest("div").querySelector(".future-temp").innerText =
        weatherData.forecast.forecastday[1].day.maxtemp_c + "°C";


      const aftertomorrow = weatherForecast.querySelector(
        "#weatherforecast__aftertomorrow",
      );
      const afterTomorrowImg = aftertomorrow.querySelector('img');
      afterTomorrowImg.src =
        weatherData.forecast.forecastday[2].day.condition.icon;
      aftertomorrow.closest("div").querySelector(".future-temp").innerText =
        weatherData.forecast.forecastday[2].day.maxtemp_c + "°C";
        afterTomorrowImg.setAttribute('alt', weatherData.forecast.forecastday[2].day.condition.text);
        afterTomorrowImg.setAttribute('title', "Übermorgen");
      weatherForecast.style.visibility = "visible";
    }
  };

  const renderArticles = function ({ articles, offset, limit }) {
    const articleContainer = document.querySelector("#articles");
    const frgmt = document.createDocumentFragment();

    if (articles && Array.isArray(articles)) {
      articles.forEach((article) => {
        frgmt.append(renderSingleArticle(article));
      });
    }

    removeReloadButton({ parent: articleContainer });
    articleContainer.appendChild(frgmt);
    addReloadButton({ parent: articleContainer, offset: offset, limit: limit });
  };

  const renderSingleArticle = function (articleData) {
    const article = document.createElement("article");
    article.dataset.articleId = articleData.id;

    let image = document.createElement("img");
    image.src = setImageSizeAndQuality({
      image: articleData.image,
      quality: 30,
      width: 200,
    });
    image.alt = articleData.image.alt;
    image.title = articleData.image.alt;
    image.classList.add("article__image");

    if (image.getAttribute("src") === "") {
      image = document.createElement("div");
      image.classList.add("article__image");
    }

    const articleDetails = createElementWithClass({
      tag: "div",
      className: "article__details",
    });

    const titleHTag = document.createElement("h2");
    const title = createElementWithClass({
      tag: "span",
      className: "article__title",
    });
    title.innerText = articleData.title;
    titleHTag.appendChild(title);

    const synopsis = createElementWithClass({
      tag: "p",
      className: "article__synopsis",
    });
    synopsis.innerText = articleData.synopsis;

    const meta = createElementWithClass({
      tag: "span",
      className: "article__meta",
    });
    const date = new Date(articleData.meta.pubDate);
    meta.innerText = date.toLocaleDateString("de-DE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    article.appendChild(image);
    articleDetails.appendChild(titleHTag);
    articleDetails.appendChild(synopsis);
    articleDetails.appendChild(meta);
    article.appendChild(articleDetails);
    return article;
  };

  const addReloadButton = function ({ parent, offset, limit }) {
    const buttonContainer = createElementWithClass({
      tag: "div",
      className: "reloadbutton",
    });
    const button = document.createElement("button");
    button.innerText = "Weitere Artikel Laden";
    button.addEventListener("click", () => {
      getArticles({ offset: offset + limit, limit });
    });

    buttonContainer.appendChild(button);
    parent.insertAdjacentElement("beforeend", buttonContainer);
  };

  const removeReloadButton = function ({ parent = null }) {
    if (!parent) {
      parent = document.querySelector("#articles");
    }
    parent.querySelector(".reloadbutton")?.remove();
  };

  const getArticleContent = function ({ articleId }) {
    fetch(heiseApi + articleId, {
      headers: getHeaders(),
    }).then((response) => {
      return response.json();
    }).then((json) => {
      console.log(json);
      showArticleContent({ articleData: json });
    });
  };

  const showArticleContent = function ({ articleData }) {
    const displayShadow = createElementWithClass({
      tag: "div",
      className: "article__display--shadow",
    });
    displayShadow.addEventListener("click", (e) => {
      if (e.target.closest(".article__display") === null) {
        removeArticleContent();
      }
    });

    const close = createElementWithClass({
      tag: "i",
      className: "article__close",
    });
    close.addEventListener("click", () => {
      removeArticleContent();
    });
    const display = createElementWithClass({
      tag: "div",
      className: "article__display",
    });

    const openerImage = createElementWithClass({
      tag: "img",
      className: "article-content__image",
    });
    openerImage.src = setImageSizeAndQuality({
      image: articleData.image,
      quality: 50,
      width: 700,
    });

    const h1Title = document.createElement("h1");
    const title = createElementWithClass({
      tag: "span",
      className: "article-content__title",
    });
    title.innerText = articleData.title;
    h1Title.appendChild(title);

    const meta = createElementWithClass({
      tag: "div",
      className: "article-content__meta",
    });
    const metaAuthor = createElementWithClass({
      tag: "span",
      className: "article-content__author",
    });
    metaAuthor.innerText = articleData.meta.author;

    if (articleData.meta.hasOwnProperty("branding")) {
      const metaBranding = createElementWithClass({
        tag: "span",
        className: "article-content__branding",
      });
      metaBranding.innerText = articleData.meta.branding;
      meta.appendChild(metaBranding);
    }

    const metaPubDate = createElementWithClass({
      tag: "span",
      className: "article-content__pub-date",
    });
    const date = new Date(articleData.meta.pubDate);
    metaPubDate.innerText = date.toLocaleDateString("de-DE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    meta.appendChild(metaAuthor);
    meta.appendChild(metaPubDate);

    const intro = createElementWithClass({
      tag: "p",
      className: "article-content__intro",
    });
    intro.innerText = articleData.synopsis;

    const content = createElementWithClass({
      tag: "p",
      className: "article-content__content",
    });
    content.innerText = articleData.content;

    display.insertAdjacentElement("afterbegin", close);
    display.insertAdjacentElement("beforeend", openerImage);
    display.insertAdjacentElement("beforeend", h1Title);
    display.insertAdjacentElement("beforeend", meta);
    display.insertAdjacentElement("beforeend", intro);
    display.insertAdjacentElement("beforeend", content);
    displayShadow.appendChild(display);

    document.querySelector("body").insertAdjacentElement(
      "afterbegin",
      displayShadow,
    );
  };

  const removeArticleContent = function () {
    document.querySelector(".article__display--shadow").remove();
  };

  const setImageSizeAndQuality = function ({ image, quality, width }) {
    let src = image.src;
    if (image.hasOwnProperty("src") && image.hasOwnProperty("width")) {
      src = src.replace(/q=70/, "q=" + quality).replace(
        /width=\d*/,
        "width=" + width,
      );
    } else {
      src = "";
    }

    return src;
  };

  const getHeaders = function () {
    const headers = new Headers();
    headers.append("X-Heise-Token", "zcJulkgE");

    return headers;
  };

  const createElementWithClass = function ({ tag, className }) {
    let el = document.createElement(tag);
    el.classList.add(className);

    return el;
  };

  return {
    getArticles: getArticles,
    getArticleContent: getArticleContent,
    getWeatherforecast: getWeatherforecast,
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  const defaultLocation = "Berlin";
  const limit = 15;

  heiseNews.getArticles({ offset: 0, limit: limit });

  document.querySelector("main").addEventListener("click", (e) => {
    if (article = e.target.closest("article")) {
      const articleId = article.dataset.articleId;
      console.log(articleId);
      heiseNews.getArticleContent({ articleId: articleId });
    }
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      heiseNews.getWeatherforecast,
      () => {
        heiseNews.getWeatherforecast(defaultLocation);
      },
    );
  } else {
    heiseNews.getWeatherforecast(defaultLocation);
  }
});
