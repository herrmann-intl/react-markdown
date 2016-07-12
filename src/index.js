import marked from 'marked'
import React from 'react'
import _ from 'lodash'

import {ReactRenderer, ReactParser} from './marked-react'

export class Markdown extends React.Component{

  render(){
    const interpolations = _.omit(this.props, "text","className", "textPreprocessor")
    const renderer = new ReactRenderer({ interpolations, textPreprocessor: this.props.textPreprocessor})
    const tokens = marked.lexer(this.props.text, {sanitize: true})
    const elements = new ReactParser({renderer}).parse(tokens)
    return (
      <span className={this.props.className}>
        {elements.map((e,i)=> { return React.cloneElement(e, {key: i+1})}) }
      </span>
    )
  }
}
