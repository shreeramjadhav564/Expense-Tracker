import json
import boto3
from decimal import Decimal
import jwt

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
sns = boto3.client('sns')

expense_table = dynamodb.Table('ExpenseTracker')
limit_table = dynamodb.Table('MonthlyBudget')

SNS_TOPIC_ARN = "arn:aws:sns:ap-south-1:209479278354:ExpenseAlertTopic"

def cors_headers():
    return {
        'Access-Control-Allow-Origin': 'http://expense-tracker-project-1.s3-website.ap-south-1.amazonaws.com',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*'
    }

def get_email(event):
    headers = {k.lower(): v for k, v in event.get('headers', {}).items()}
    token = headers.get('authorization')
    if not token:
        raise Exception("Authorization token is missing")
    decoded = jwt.decode(token, options={"verify_signature": False})
    return decoded['email']


def lambda_handler(event, context):
    try:
        if event['httpMethod'] == 'OPTIONS':
            return {'statusCode': 200, 'headers': cors_headers()}

        if event['httpMethod'] != 'POST':
            return {'statusCode': 405, 'headers': cors_headers(), 'body': json.dumps({'error': 'Method Not Allowed'})}

        body = json.loads(event['body'])
        email = get_email(event)

        expense_id = body.get('expense_id')
        amount = Decimal(str(body.get('amount')))
        purpose = body.get('purpose')
        date = body.get('date')
        month = date[:7]

        expense_table.put_item(Item={
            'user_email': email,
            'expense_id': expense_id,
            'amount': amount,
            'purpose': purpose,
            'date': date
        })

        # Query user's expenses only
        response = expense_table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('user_email').eq(email)
        )
        monthly_expenses = sum(Decimal(i['amount']) for i in response['Items'] if i['date'].startswith(month))

        # Get monthly limit
        limit_data = limit_table.get_item(Key={'user_email': email, 'month': month})
        if 'Item' in limit_data:
            limit = Decimal(str(limit_data['Item']['limit']))
            remaining = limit - monthly_expenses

            if monthly_expenses > limit:
                sns.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject='💸 Budget Limit Exceeded',
                    Message=f"⚠️ Expenses for {month} exceeded your limit!\nLimit: ₹{limit}\nSpent: ₹{monthly_expenses}"
                )

            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({
                    'message': 'Expense saved',
                    'monthly_total': float(monthly_expenses),
                    'monthly_limit': float(limit),
                    'remaining_budget': float(remaining)
                })
            }

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'message': 'Expense saved (no monthly limit set)',
                'monthly_total': float(monthly_expenses)
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': str(e)})
        }
