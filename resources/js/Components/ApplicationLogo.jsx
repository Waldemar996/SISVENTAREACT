export default function ApplicationLogo(props) {
    return (
        <img src="/images/logo.png" alt="SISVENTA" {...props} className={props.className || "h-16 w-auto"} />
    );
}
