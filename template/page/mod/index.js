import React,{Component} from 'react';
class <%=classedName%> extends Component {
    constructor(props, context) {
        super(props, context);
        this.state = {

        };
    }
    render() {
        return (
        <div className="<%= classname %>-page">
        <%= pname %> hello world
        </div>
        );
    }
    componentDidMount(){}
}

export default <%=classedName%>;

