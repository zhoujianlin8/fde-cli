<%if(isReact){%>
import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import <%=classedName%> from './mod/index';
ReactDOM.render(<<%=classedName%> />, document.getElementById('container'));
<%}else{%>
import './index.scss';
import <%=classedName%> from './mod/index';
import $ from 'zepto';
const page = {
    init(){
        this.view();
        this.bindEvent();
    },
    view(){

    },
    bindEvent(){

    }
};

$(function () {
    page.init();
});
<%}%>