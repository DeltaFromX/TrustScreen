const params = new URLSearchParams(location.search);
document.getElementById("url").innerText = decodeURIComponent(params.get("url"));

const reasons = [
  "This website has been identified as a phishing site.",
  "Access to it is blocked for your security."
];
const reasonsListElement = document.getElementById("reasons-list");
reasons.forEach(r => {
  const li = document.createElement("li");
  li.textContent = r;
  reasonsListElement.appendChild(li);
});