import React, { Component } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Route, useLocation } from "react-router-dom";
import ArticleEditor from "./Components/ArticleEditor";
import HomePage from "./Components/HomePage";
import ArticlesManager from "./Components/ArticlesManager";

function App() {
  return (
    <div className="App">
      <Router>
        <Route
          exact
          path="/edit_article"
          component={ArticleEditor}
          // render={(props) => <ArticleEditor article_id={123} />}
        />
        <Route exact path="/manage_articles" component={ArticlesManager} />
        <Route exact path="/" component={HomePage} />
      </Router>
    </div>
  );
}

export default App;
