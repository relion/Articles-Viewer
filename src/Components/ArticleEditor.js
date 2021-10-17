import React from "react";
import { Link } from "react-router-dom";
// import * as ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import ClassicEditor, {
  Essentials,
  Direction, // lilo
} from "ckeditor5-build-classic-complete";
// import Direction from "ckeditor5-direction/src/direction";
import ckeditor, { CKEditor } from "@ckeditor/ckeditor5-react";
// import { useParams } from "react-router";
const dateFormat = require("dateformat");

export default class ArticleEditor extends React.Component {
  state = {
    autor: "",
    title: "",
    description: "",
    content: "",
    time: null,

    description_rows: 2,
    description_minRows: 2,
    description_maxRows: 5,

    status_txt: "",
    document_doesnt_exist: false,
  };

  constructor(props) {
    super(props);
    let params = new URLSearchParams(window.location.search);
    this.state.id = params.get("id");
    if (this.state.id == null) this.state.id = "-1";
  }

  componentDidMount() {
    document.title = "Article Editor";

    if (this.state.id != "-1")
      fetch("/get_article?id=" + this.state.id)
        .then((res) => res.json())
        .then((res) => {
          if (res.id == undefined)
            this.setState({ document_doesnt_exist: true });
          else this.setState(res);
        })
        .catch((err) => {
          this.setState({
            status_txt: "error loading article: " + this.state.id,
          });
        });
    else {
      fetch("/get-user?id=" + this.state.id)
        .then((res) => res.json())
        .then((res) => {
          this.setState(res);
        });
    }
  }

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState({
      [name]: value,
      status_txt: "",
    });
    console.log(this.state);
  };

  handleCKEditorState = (event, editor) => {
    const data = editor.getData();
    this.setState({
      content: data,
      status_txt: "",
    });
    console.log(data);
  };

  handleTAChange = (event) => {
    const textareaLineHeight = 24;
    const { description_minRows, description_maxRows } = this.state;

    const previousRows = event.target.rows;
    event.target.rows = description_minRows; // reset number of rows in textarea

    const currentRows = ~~(event.target.scrollHeight / textareaLineHeight);

    if (currentRows === previousRows) {
      event.target.rows = currentRows;
    }

    if (currentRows >= description_maxRows) {
      event.target.rows = description_maxRows;
      event.target.scrollTop = event.target.scrollHeight;
    }

    this.setState({
      description: event.target.value,
      rows:
        currentRows < description_maxRows ? currentRows : description_maxRows,
      status_txt: "",
    });
  };

  handleSubmit = (event) => {
    console.log();
    event.preventDefault();
    this.setState({ status_txt: "submitting..." });
    var json = JSON.stringify({
      autor: this.state.autor,
      title: this.state.title,
      description: this.state.description,
      content: this.state.content,
      id: this.state.id,
    });
    fetch("/save_article", {
      method: "POST",
      // mode: "cors",
      headers: {
        "Content-Type": "text/html",
      },
      mode: "cors",
      body: json,
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.error) {
          this.setState({ status_txt: "submitting FAILED!" });
        } else {
          if (res.new_id != undefined) {
            this.setState({ id: res.new_id });
            var msg_txt = "new article created, id = " + res.new_id;
            this.setState({ status_txt: msg_txt });
            setTimeout(() => {
              if (this.state.status_txt == msg_txt)
                this.setState({ status_txt: "" });
            }, 5000);
            return;
          }
          var msg_txt = "successfully updated";
          this.setState({ status_txt: msg_txt });
          setTimeout(() => {
            if (this.state.status_txt == msg_txt)
              this.setState({ status_txt: "" });
          }, 5000);
        }
      })
      .catch((err) => {
        this.setState({
          status_txt:
            "Failed to update the article (check if you are logged-in)",
        });
      });
  };

  render() {
    if (this.state.document_doesnt_exist)
      return <div>document id = {this.state.id} doesnt exist.</div>;
    return (
      <div className="container">
        <div className="wrapper">
          <form className="form-group" onSubmit={this.handleSubmit}>
            <h1>Article Editor</h1>
            <h5>{dateFormat(this.state.time, "dd-mmm-yyyy H:MM")}</h5>
            <div className="form-group mt-2">
              <label>Autor</label>
              <input
                type="text"
                name="autor"
                value={this.state.autor}
                onChange={this.handleChange}
                placeholder="Enter Autor"
                className="form-control"
                required
              />
            </div>
            <div className="form-group mt-2">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={this.state.title}
                onChange={this.handleChange}
                placeholder="Enter Title"
                className="form-control"
                required
              />
            </div>
            <div className="form-group mt-2">
              <label>Description</label>
              <textarea
                rows={this.state.rows}
                value={this.state.value}
                name="description"
                value={this.state.description}
                onChange={this.handleTAChange}
                className="form-control"
                placeholder="Enter description"
              />
            </div>
            <div className="form-group mt-2">
              <label>Content</label>
              {/* <textarea
                cols="25"
                rows="14"
                name="content"
                value={this.state.content}
                onChange={this.handleChange}
                className="form-control"
                placeholder="Enter Message"
              /> */}
              <CKEditor
                editor={ClassicEditor}
                data={this.state.content}
                onReady={(editor) => {}}
                onChange={this.handleCKEditorState}
                config={{
                  ckfinder: {
                    uploadUrl:
                      "/uploads?command=QuickUpload&type=Files&responseType=json",
                  },
                  // https://documentation.bloomreach.com/14/library/concepts/document-types/html-fields/ckeditor-toolbar-items.html
                  toolbar: [
                    "heading",
                    "|",
                    "bold",
                    "italic",
                    "underline",
                    "blockQuote",
                    "highlight",
                    "direction", // lilo
                    "bidi", // lilo
                    "alignment",
                    "link",
                    "numberedList",
                    "bulletedList",
                    "imageUpload",
                    "insertTable",
                    "tableColumn",
                    "tableRow",
                    "mergeTableCells",
                    "mediaEmbed",
                    "|",
                    "undo",
                    "redo",
                  ],
                  language: "he", // lilo
                }}
              />
            </div>
            <div className="form-group mt-2">
              <input
                type="submit"
                value={
                  this.state.id == "-1" ? "Save The New Article" : "Update"
                }
                name="submit"
                className="btn btn-primary"
              />{" "}
              <span>{this.state.status_txt}</span>
            </div>
            <div className="mt-2 mb-2">
              <Link to={"/manage_articles"}>
                <button type="button" className="btn btn-primary">
                  Manage Articles
                </button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
