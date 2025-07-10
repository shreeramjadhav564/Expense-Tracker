import json
import boto3
from decimal import Decimal
import jwt

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
expense_table = dynamodb.Table('ExpenseTracker')

def cors_headers():
    return {
        'Access-Control-Allow-Origin': 'http://expense-tracker-project-1.s3-website.ap-south-1.amazonaws.com',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*'
    }

def decimal_serializer(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def get_email(event):
    token = event.get('headers', {}).get('Authorization')
    if not token:
        raise Exception("Authorization token is missing")
    decoded = jwt.decode(token, options={"verify_signature": False})
    return decoded['email']

def lambda_handler(event, context):
    try:
        if event['httpMethod'] == 'OPTIONS':
            return {'statusCode': 200, 'headers': cors_headers()}

        if event['httpMethod'] != 'GET':
            return {'statusCode': 405, 'headers': cors_headers(), 'body': json.dumps({'error': 'Method Not Allowed'})}

        email = get_email(event)

        response = expense_table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('user_email').eq(email)
        )
        items = sorted(response['Items'], key=lambda x: x.get('date', ''), reverse=True)

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps(items, default=decimal_serializer)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': str(e)})
        }
