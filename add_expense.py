import json
import boto3
from decimal import Decimal

# AWS clients
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
sns = boto3.client('sns')

# Tables
expense_table = dynamodb.Table('ExpenseTracker')
limit_table = dynamodb.Table('MonthlyBudget')  # This only holds monthly limits

# SNS Topic ARN
SNS_TOPIC_ARN = "arn:aws:sns:ap-south-1:209479278354:ExpenseAlertTopic"  # Replace with your actual ARN

# CORS headers
def cors_headers():
    return {
        'Access-Control-Allow-Origin': 'http://expense-tracker-project-1.s3-website.ap-south-1.amazonaws.com',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*'
    }

def lambda_handler(event, context):
    print("Incoming event:", json.dumps(event))

    method = event.get('httpMethod')

    # Handle missing method
    if not method:
        return {
            'statusCode': 400,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Missing httpMethod'})
        }

    # Handle preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({'message': 'CORS preflight success'})
        }

    # Only allow POST
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Method Not Allowed'})
        }

    try:
        body = json.loads(event['body'])

        expense_id = body['expense_id']
        amount = Decimal(str(body['amount']))
        purpose = body['purpose']
        date = body['date']  # Expected format: YYYY-MM-DD
        expense_month = date[:7]  # Extract YYYY-MM

        # Save the expense
        expense_table.put_item(Item={
            'expense_id': expense_id,
            'amount': amount,
            'purpose': purpose,
            'date': date
        })

        # Fetch all expenses and calculate total for the month
        response = expense_table.scan()
        monthly_expenses = sum(
            Decimal(e['amount']) for e in response['Items'] if e.get('date', '').startswith(expense_month)
        )

        # Get limit for the month
        limit_data = limit_table.get_item(Key={'month': expense_month})
        if 'Item' in limit_data:
            monthly_limit = Decimal(str(limit_data['Item']['limit']))
            remaining = monthly_limit - monthly_expenses

            # Send alert if over budget
            if monthly_expenses > monthly_limit:
                sns.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject='💸 Budget Limit Exceeded',
                    Message=f"⚠️ Your expenses for {expense_month} exceeded the limit!\n\nLimit: ₹{monthly_limit}\nTotal: ₹{monthly_expenses}"
                )

            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({
                    'message': 'Expense saved',
                    'monthly_total': float(monthly_expenses),
                    'monthly_limit': float(monthly_limit),
                    'remaining_budget': float(remaining)
                })
            }

        # No limit set
        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'message': 'Expense saved (no monthly limit set)',
                'monthly_total': float(monthly_expenses)
            })
        }

    except Exception as e:
        print("Error:", str(e))
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': str(e)})
        }
