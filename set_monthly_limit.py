import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
limit_table = dynamodb.Table('MonthlyBudget')
expense_table = dynamodb.Table('ExpenseTracker')  # Make sure this exists

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "http://expense-tracker-project-1.s3-website.ap-south-1.amazonaws.com",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*"
    }

def lambda_handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": cors_headers(),
            "body": json.dumps({"message": "CORS preflight success"})
        }

    if event.get("httpMethod") != "POST":
        return {
            "statusCode": 405,
            "headers": cors_headers(),
            "body": json.dumps({"error": "Method Not Allowed"})
        }

    try:
        body = json.loads(event.get("body", "{}"))
        month = body.get("month")
        limit = body.get("limit")

        if not month or limit is None:
            return {
                "statusCode": 400,
                "headers": cors_headers(),
                "body": json.dumps({"error": "Missing 'month' or 'limit'"})
            }

        limit_table.put_item(Item={
            'month': month,
            'limit': Decimal(str(limit))
        })

        response = expense_table.scan()
        total_expense = sum(
            Decimal(e['amount']) for e in response['Items']
            if e.get('date', '').startswith(month)
        )

        remaining = Decimal(str(limit)) - total_expense

        return {
            "statusCode": 200,
            "headers": cors_headers(),
            "body": json.dumps({
                "message": "Monthly limit saved!",
                "month": month,
                "monthly_limit": float(limit),
                "monthly_expense": float(total_expense),
                "remaining_budget": float(remaining)
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": cors_headers(),
            "body": json.dumps({"error": str(e)})
        }
