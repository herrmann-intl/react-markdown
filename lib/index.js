'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Markdown = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _marked = require('marked');

var _marked2 = _interopRequireDefault(_marked);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _markedReact = require('./marked-react');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Markdown = exports.Markdown = function (_React$Component) {
  _inherits(Markdown, _React$Component);

  function Markdown() {
    _classCallCheck(this, Markdown);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Markdown).apply(this, arguments));
  }

  _createClass(Markdown, [{
    key: 'render',
    value: function render() {
      var interpolations = _lodash2.default.omit(this.props, "text", "className", "textPreprocessor");
      var renderer = new _markedReact.ReactRenderer({ interpolations: interpolations, textPreprocessor: this.props.textPreprocessor });
      var tokens = _marked2.default.lexer(this.props.text, { sanitize: true });
      var elements = new _markedReact.ReactParser({ renderer: renderer }).parse(tokens);
      return _react2.default.createElement(
        'span',
        { className: this.props.className },
        elements.map(function (e, i) {
          return _react2.default.cloneElement(e, { key: i + 1 });
        })
      );
    }
  }]);

  return Markdown;
}(_react2.default.Component);