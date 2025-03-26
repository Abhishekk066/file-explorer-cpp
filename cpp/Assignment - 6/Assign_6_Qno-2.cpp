#include <iostream>
using namespace std;

class MyFact {
private:
    int fact = 1, num;

    int calculate() {
        for (int i = num; i > 0; i--) {
            fact *= i;
        }
        return fact;
    }

public:
    void input(int n) {
        num = n;
    }

    friend class MyFact2;
};

class MyFact2{
public:
    void display(MyFact f) {
        cout << "Factorial: " << f.calculate() << endl;
    }
};

int main() {
    int num;
    cout << "Enter Number: ";
    cin >> num;
    MyFact fact;
    fact.input(num);
    MyFact2 f;
    f.display(fact);
    return 0;
}

