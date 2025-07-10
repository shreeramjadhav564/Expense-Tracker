import json
import boto3
from decimal import Decimal
import jwt

# AWS DynamoDB Setup
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
limit_table = dynamodb.Table('MonthlyBudget')
expense_table = dynamodb.Table('ExpenseTracker')

# CORS Headers
def cors_headers():
    return {
        "Access-Control-Allow-Origin": "http://expense-tracker-project-1.s3-website.ap-south-1.amazonaws.com",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*"
    }

# Extract email from ID Token
def get_email(event):
    try:
        headers = {k.lower(): v for k, v in event.get('headers', {}).items()}
        token = headers.get('authorization')
        if not token:
            raise Exception("Authorization token is missing")
        decoded = jwt.decode(token, options={"verify_signature": False})
        return decoded['email']
    except Exception as e:
        raise Exception(f"Failed to extract email: {str(e)}")

# Lambda Handler
def lambda_handler(event, context):
    try:
        method = event.get("httpMethod")

        if method == "OPTIONS":
            return {
                "statusCode": 200,
                "headers": cors_headers(),
                "body": json.dumps({"message": "CORS preflight success"})
            }

        if method != "POST":
            return {
                "statusCode": 405,
                "headers": cors_headers(),
                "body": json.dumps({"error": "Method Not Allowed"})
            }

        user_email = get_email(event)

        body = json.loads(event.get("body", "{}"))
        month = body.get("month")
        limit = body.get("limit")

        if not month or limit is None:
            return {
                "statusCode": 400,
                "headers": cors_headers(),
                "body": json.dumps({"error": "Missing 'month' or 'limit'"})
            }

        # Save monthly limit to DB
        limit_table.put_item(Item={
            'user_email': user_email,
            'month': month,
            'limit': Decimal(str(limit))
        })

        # Get all user expenses for this month
        response = expense_table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('user_email').eq(user_email)
        )
        monthly_expenses = sum(
            Decimal(e['amount']) for e in response['Items']
            if e.get('date', '').startswith(month)
        )

        remaining = Decimal(str(limit)) - monthly_expenses

        return {
            "statusCode": 200,
            "headers": cors_headers(),
            "body": json.dumps({
                "message": "Monthly limit saved!",
                "month": month,
                "monthly_limit": float(limit),
                "monthly_expense": float(monthly_expenses),
                "remaining_budget": float(remaining)
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": cors_headers(),
            "body": json.dumps({"error": str(e)})
        }
