const Bubble = ({message}) =>{
console.log("Rendering message:", message);
const {content,role}=message
    return (
        <div className={`${role} bubble`}>{content}</div>
    )
}


export default Bubble