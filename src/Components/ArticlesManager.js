import React from "react";
import { Link } from "react-router-dom";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";

export default class ArticlesManager extends React.Component {
  state = {};

  componentDidMount() {
    fetch("/get_all_articles")
      .then((res) => res.json())
      .then((res) => {
        this.setState({ articles_list: res });
        console.log(res);
      })
      .catch((err) => {
        this.setState({
          status_txt: "error loading all articles",
        });
      });
  }

  DeleteArticle() {
    confirmAlert({
      title: "Delete Article: " + this.article.title,
      message: "Are you sure?",
      buttons: [
        {
          label: "Yes",
          onClick: () => {
            fetch("/delete_article?id=" + this.article.id, {
              method: "GET",
            })
              .then((res) => res.json())
              .then((res) => {
                this.obj.setState({ articles_list: res });
              })
              .catch((err) => {
                alert("error deleting article: " + this.article.id);
              });
          },
        },
        {
          label: "No",
        },
      ],
    });
  }

  render() {
    return (
      <div className="m-2">
        <h1>Articles Manager</h1>
        {this.state.articles_list &&
          this.state.articles_list.map((article) => (
            <div className="mt-2">
              {article.title}{" "}
              <Link to={"/edit_article?id=" + article.id}>
                <button type="button" className="btn btn-primary">
                  Edit
                </button>
              </Link>{" "}
              <button
                type="button"
                className="btn btn-danger"
                onClick={this.DeleteArticle.bind({
                  article: article,
                  obj: this,
                })}
              >
                Delete
              </button>
            </div>
          ))}
        <div className="mt-2 mb-2">
          <Link to={"/edit_article"}>
            <button type="button" className="btn btn-primary">
              New Article
            </button>
          </Link>
        </div>
      </div>
    );
  }
}
