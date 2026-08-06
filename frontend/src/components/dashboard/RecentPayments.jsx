export default function RecentPayments({payments=[]}) {

return (

<div className="
bg-white
border
border-gray-200
p-5
">

<h2 className="
font-semibold
text-gray-800
mb-4
">
Recent Payments
</h2>


<div className="divide-y">

{
payments.length === 0 && (

<p className="text-gray-500 text-sm">
No payments yet
</p>

)
}


{
payments.map((payment)=>(

<div
key={payment.receipt_number}
className="
py-3
flex
justify-between
"
>


<div>

<p className="font-medium text-gray-800">
{payment.student_fee__student__first_name}
</p>

<p className="text-sm text-gray-500">
{payment.receipt_number}
</p>

</div>


<p className="font-semibold">
₹ {payment.amount}
</p>


</div>

))
}


</div>

</div>

)

}