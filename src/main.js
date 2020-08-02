import { ToyReact, Component } from "./ToyReact";

class Square extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  render() {
    return (
      <button
        className="square"
        onClick={() => {
          this.setState({ value: "X" });
        }}
      >
        {this.state.value ? this.state.value : ""}
      </button>
    );
  }
}

class Board extends Component {
  renderSquare(i) {
    return <Square value={this.props.squares[i]} />;
  }

  render() {
    return (
      <div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
      </div>
    );
  }
}

ToyReact.render(
  <Board squares={[0, 1, 2, 3, 4, 5, 6, 7, 8]}>
    <div>sdad</div>
  </Board>,
  document.getElementById("root")
);
